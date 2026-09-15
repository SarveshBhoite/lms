import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminDrawerLayout from "./AdminDrawerLayout";
import DeactivatedAccountScreen from "@/components/student/DeactivatedAccountScreen";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Verify admin account isActive and profile details
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      isActive: true,
      name: true,
      email: true,
      role: true,
      profile: { select: { avatarUrl: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.isActive) {
    return (
      <DeactivatedAccountScreen
        userName={user.name}
        userEmail={user.email}
        role="ADMIN"
      />
    );
  }

  // Parallel counts for badge indicators across admin portal
  const [
    unreadNotificationsCount,
    activeBatchesCount,
    totalStudentsCount,
  ] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    }),
    prisma.batch.count({
      where: { status: "ONGOING" },
    }),
    prisma.user.count({
      where: { role: "STUDENT", isActive: true },
    }),
  ]);

  return (
    <AdminDrawerLayout
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl,
      }}
      unreadNotificationsCount={unreadNotificationsCount}
      activeBatchesCount={activeBatchesCount}
      totalStudentsCount={totalStudentsCount}
    >
      {children}
    </AdminDrawerLayout>
  );
}
