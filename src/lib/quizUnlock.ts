import prisma from "@/lib/prisma";

export interface LessonUnlockStatus {
  lessonId: string;
  moduleId: string;
  title: string;
  orderIndex: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  lockReason?: string;
  attachedQuiz?: {
    id: string;
    title: string;
    passingMarks: number;
    maxAttempts: number;
    timeLimitMinutes: number;
    isRequiredForUnlock: boolean;
    userAttemptsCount: number;
    userBestScore: number | null;
    isPassed: boolean;
    canAttempt: boolean;
  } | null;
}

export async function getCourseLessonUnlockStatuses(
  userId: string,
  courseId: string
): Promise<Record<string, LessonUnlockStatus>> {
  // 1. Fetch modules & lessons in order
  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      orderIndex: true,
      lessons: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          moduleId: true,
          quizzes: {
            where: { status: "PUBLISHED" },
            select: {
              id: true,
              title: true,
              passingMarks: true,
              maxAttempts: true,
              timeLimitMinutes: true,
              isRequiredForUnlock: true,
            },
          },
        },
      },
    },
  });

  // Flatten lessons in order
  const orderedLessons: Array<{
    id: string;
    title: string;
    orderIndex: number;
    moduleId: string;
    quizzes: Array<{
      id: string;
      title: string;
      passingMarks: number;
      maxAttempts: number;
      timeLimitMinutes: number;
      isRequiredForUnlock: boolean;
    }>;
  }> = [];

  for (const mod of modules) {
    for (const les of mod.lessons) {
      orderedLessons.push(les);
    }
  }

  if (orderedLessons.length === 0) {
    return {};
  }

  // 2. Fetch user's lesson progress
  const lessonProgresses = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: orderedLessons.map((l) => l.id) },
    },
    select: {
      lessonId: true,
      isCompleted: true,
    },
  });

  const completedLessonMap = new Map<string, boolean>();
  lessonProgresses.forEach((lp) => {
    if (lp.isCompleted) {
      completedLessonMap.set(lp.lessonId, true);
    }
  });

  // 3. Fetch user's quiz attempts for attached quizzes
  const allQuizIds: string[] = [];
  orderedLessons.forEach((l) => {
    l.quizzes.forEach((q) => allQuizIds.push(q.id));
  });

  const quizAttempts = allQuizIds.length > 0
    ? await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizId: { in: allQuizIds },
        },
        select: {
          quizId: true,
          score: true,
          isPassed: true,
        },
      })
    : [];

  const quizStatsMap = new Map<
    string,
    { attemptsCount: number; bestScore: number | null; isPassed: boolean }
  >();

  quizAttempts.forEach((qa) => {
    const existing = quizStatsMap.get(qa.quizId) || {
      attemptsCount: 0,
      bestScore: null,
      isPassed: false,
    };
    existing.attemptsCount += 1;
    if (qa.score !== null && qa.score !== undefined) {
      existing.bestScore = existing.bestScore === null ? qa.score : Math.max(existing.bestScore, qa.score);
    }
    if (qa.isPassed) {
      existing.isPassed = true;
    }
    quizStatsMap.set(qa.quizId, existing);
  });

  // 4. Calculate sequential unlock state for each lesson
  const result: Record<string, LessonUnlockStatus> = {};

  let canUnlockNext = true;
  let previousLockReason = "";

  for (let i = 0; i < orderedLessons.length; i++) {
    const lesson = orderedLessons[i];
    const isCompleted = Boolean(completedLessonMap.get(lesson.id));

    // Determine attached quiz status if any
    const attachedQuizRaw = lesson.quizzes[0] || null; // Primary attached quiz
    let attachedQuizInfo: LessonUnlockStatus["attachedQuiz"] = null;

    if (attachedQuizRaw) {
      const stats = quizStatsMap.get(attachedQuizRaw.id) || {
        attemptsCount: 0,
        bestScore: null,
        isPassed: false,
      };

      const canAttempt = !stats.isPassed && stats.attemptsCount < attachedQuizRaw.maxAttempts;

      attachedQuizInfo = {
        id: attachedQuizRaw.id,
        title: attachedQuizRaw.title,
        passingMarks: attachedQuizRaw.passingMarks,
        maxAttempts: attachedQuizRaw.maxAttempts,
        timeLimitMinutes: attachedQuizRaw.timeLimitMinutes,
        isRequiredForUnlock: attachedQuizRaw.isRequiredForUnlock,
        userAttemptsCount: stats.attemptsCount,
        userBestScore: stats.bestScore,
        isPassed: stats.isPassed,
        canAttempt,
      };
    }

    // First lesson is always unlocked
    const isUnlocked = i === 0 ? true : canUnlockNext;
    const lockReason = isUnlocked ? undefined : previousLockReason;

    result[lesson.id] = {
      lessonId: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      orderIndex: lesson.orderIndex,
      isUnlocked,
      isCompleted,
      lockReason,
      attachedQuiz: attachedQuizInfo,
    };

    // Calculate whether the NEXT lesson can be unlocked
    if (!isCompleted) {
      canUnlockNext = false;
      previousLockReason = `Complete "${lesson.title}" first to unlock the next lesson.`;
    } else if (attachedQuizInfo && attachedQuizInfo.isRequiredForUnlock && !attachedQuizInfo.isPassed) {
      canUnlockNext = false;
      previousLockReason = `Pass the required quiz for "${lesson.title}" (Passing Score: ${attachedQuizInfo.passingMarks}%) to unlock the next lesson.`;
    }
  }

  return result;
}

export async function checkSingleLessonUnlocked(
  userId: string,
  lessonId: string
): Promise<{ isUnlocked: boolean; lockReason?: string }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });

  if (!lesson) {
    return { isUnlocked: false, lockReason: "Lesson not found." };
  }

  const courseId = lesson.module.courseId;
  const unlockMap = await getCourseLessonUnlockStatuses(userId, courseId);
  const status = unlockMap[lessonId];

  if (!status) {
    return { isUnlocked: true }; // Default unlock if no map found
  }

  return {
    isUnlocked: status.isUnlocked,
    lockReason: status.lockReason,
  };
}
