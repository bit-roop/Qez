"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { TeacherDashboardClient } from "@/components/teacher/teacher-dashboard-client";

export default function TeacherDashboardPage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN"]}
        description="Login with a teacher or admin account to create and manage academic quizzes."
        title="Teacher Dashboard"
      >
        {(session) => <TeacherDashboardClient session={session} />}
      </SessionGate>
    </main>
  );
}
