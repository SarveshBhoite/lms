# 🎓 JVM Institute LMS — Full Acceptance & QA Testing Checklist

Use this structured checklist to test each module (A through L) step by step across **Super Admin**, **Trainer / Faculty**, and **Student** portals.

---

### 🔑 Test Credentials Reference

| Role | Email | Password | Primary Portal Route |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `rajb81008@gmail.com` | `12345678` | `http://localhost:3000/admin/dashboard` |
| **Trainer / Faculty** | `trainer@institute.edu` | `Password123!` | `http://localhost:3000/trainer/dashboard` |
| **Student** | `student@institute.edu` | `Password123!` | `http://localhost:3000/student/dashboard` |

---

## 📋 Module A: UI/UX & Responsive Design
- [ ] **A1. Brand Theme & Colors**: Check that `#1E2B88` (Royal Blue), `#7C248C` (Purple), `#E01E6A` (Magenta), and JVM Institute Logo appear across all portals.
- [ ] **A2. Navigation & Sidebar**: Click through sidebar links in all 3 portals; active items highlight with `.jvm-gradient-bg`.
- [ ] **A3. Responsive Layout**: Resize the browser window or test on mobile/tablet viewport; sidebar collapses into mobile hamburger menu seamlessly.
- [ ] **A4. Visual Hierarchy**: Check cards, buttons, badges, tables, and modal dialogs for glassmorphic styling and smooth hover interactions.

---

## 📋 Module B: Authentication & User Management
- [ ] **B1. Unified Login (`/login`)**:
  - Test login with Super Admin, Trainer, and Student credentials.
  - Verify role-based automatic redirection to `/admin/dashboard`, `/trainer/dashboard`, or `/student/dashboard`.
- [ ] **B2. Role-Based Access Control (RBAC)**:
  - Log in as Student and try accessing `/admin/dashboard` or `/trainer/dashboard`; verify access is denied / redirected.
- [ ] **B3. Profile & Security (`/student/profile`, `/trainer/profile`)**:
  - Update user name, phone, bio, and change password.
  - Test login with the newly updated password.
- [ ] **B4. Sign Out**:
  - Click "Sign Out" in the sidebar; verify JWT session cookie is cleared and redirected back to `/login`.

---

## 📋 Module C: Student Learning System
- [ ] **C1. Student Dashboard (`/student/dashboard`)**:
  - Verify metrics: Enrolled Courses, Completed Lessons, Quizzes Taken, and Certificates Earned.
  - Check "Continue Learning" course cards and Upcoming Live Google Meet sessions.
- [ ] **C2. My Courses Catalog (`/student/courses`)**:
  - Verify enrolled courses, batch badges, and overall progress bars.
  - Click "Open Course Studio" to navigate to `/student/courses/[courseId]`.
- [ ] **C3. Course Player & Curriculum (`/student/courses/[courseId]`)**:
  - Switch between **Learning Player**, **Resources**, **Quizzes**, **Assignments**, and **Overview** tabs.
  - Select video, text, PDF, code, or dataset lessons.
  - Click **"Mark as Complete"**; verify progress bar increments in real-time.

---

## 📋 Module D & E: Course, Video & Document Management
- [ ] **D1. Admin Course Management (`/admin/courses`)**:
  - Create a new course with title, description, level (Beginner/Intermediate/Advanced), duration, and assigned trainer.
  - Test editing course metadata and publishing/unpublishing courses.
- [ ] **D2. Trainer Curriculum Studio (`/trainer/courses/[courseId]`)**:
  - Add modules and order them.
  - Add lessons with different content types: Video (YouTube/MP4), PDF, Document, Text, Code snippets, and Datasets.
- [ ] **E1. Video Player & Media Controls**:
  - Play video lessons; test play/pause, volume, fullscreen, and playback speeds (0.5x, 1x, 1.5x, 2x).
- [ ] **E2. Resource Downloads**:
  - Download attached PDFs, cheat sheets, or datasets from the course resources tab.

---

## 📋 Module F: Assessment & Assignment Management
- [ ] **F1. Trainer Quiz Creation (`/trainer/quizzes`)**:
  - Create a timed quiz with passing score (%) and time limit.
  - Add questions: Multiple Choice (MCQ), True/False, and Multiple-Answer.
- [ ] **F2. Student Quiz Execution (`/student/quizzes`)**:
  - Start assessment; test timer countdown.
  - Submit answers; verify instant automated score calculation, pass/fail status, and attempt history.
- [ ] **F3. Trainer Assignment Setup (`/trainer/assignments`)**:
  - Create an assignment with title, instructions, total marks, and submission deadline.
- [ ] **F4. Student Project Submission (`/student/assignments`)**:
  - Submit GitHub repo link, deployment URL, or project notes.
- [ ] **F5. Trainer Evaluation & Grading (`/trainer/assignments/[id]`)**:
  - Review student submission, award score (e.g. `95/100`), write feedback notes, and mark as `EVALUATED`.
  - Verify student sees updated marks and feedback instantly.

---

## 📋 Module G: Certificate Management & QR Verification
- [ ] **G1. Certificate Issuance (`/admin/certificates`)**:
  - Issue certificate upon 100% course completion.
  - Check generated unique certificate ID (e.g. `JVM-CERT-2026-XXXX`).
- [ ] **G2. Student Certificate Download (`/student/certificates`)**:
  - View certificate card with course name, issue date, and "View & Download" button.
- [ ] **G3. Public QR Verification Route (`/verify/certificate/[id]`)**:
  - Open certificate verification URL in incognito/public browser.
  - Verify student name, course title, completion date, and verified credential seal appear without requiring login.

---

## 📋 Module H & I: Batch, Trainer & Admin Management
- [ ] **H1. Batch Creation & Trainer Assignment (`/admin/batches`, `/trainer/batches`)**:
  - Create batch (e.g. `Full Stack Java Cohort - Batch A`), set start date, max capacity, and assign trainer.
- [ ] **H2. Student Enrollment (`/admin/enrollments`, `/admin/students`)**:
  - Enroll student into batch and course; verify student immediately gains access on their dashboard.
- [ ] **I1. Admin Central Dashboard (`/admin/dashboard`)**:
  - Check real-time counts for Total Students, Active Trainers, Courses, Batches, and Enrollments.
  - Inspect Activity Logs stream (`/admin/activity-logs`).

---

## 📋 Module J: Live Classes & Attendance
- [ ] **J1. Live Class Scheduling (`/trainer/live-classes`)**:
  - Schedule a Google Meet live class with date, time, cohort batch, and Google Meet URL.
- [ ] **J2. Student Live Class Portal (`/student/live-classes`)**:
  - Check upcoming class card; click **"Join Google Meet"** to open Meet in a new tab.
- [ ] **J3. Attendance Logging (`/trainer/attendance/[batchId]`)**:
  - Mark student as `PRESENT`, `LATE`, or `ABSENT`.
  - Check attendance % updates on both Trainer roster and Student Attendance view (`/student/attendance`).

---

## 📋 Module K: Notifications, Search & Reports
- [ ] **K1. Admin Broadcasts (`/admin/notifications`)**:
  - Send system-wide announcement or cohort-specific broadcast.
  - Verify notification appears on Student (`/student/notifications`) and Trainer (`/trainer/notifications`) panels.
- [ ] **K2. Search & Filtering**:
  - Search students, trainers, courses, and batches by keyword across Admin and Trainer tables.
- [ ] **K3. Analytics & Export Reports (`/admin/reports`, `/trainer/reports`)**:
  - View enrollment metrics, quiz pass rates, and attendance graphs.
  - Click **"Export CSV / Excel"** to download tabular report data.

---

## 📋 Module L: Security, Performance & Deployment
- [ ] **L1. Protected API Endpoints**:
  - Test `/api/admin/*`, `/api/trainer/*`, `/api/student/*` — confirm unauthorized requests receive 401/403.
- [ ] **L2. Input Validation**:
  - Verify required fields in forms prevent empty or invalid submissions with descriptive toasts.
- [ ] **L3. Production Build Validation**:
  - Run `npm run build` to confirm zero TypeScript, React, or Next.js build errors.
