"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { TeacherDashboardClient } from "@/components/teacher/teacher-dashboard-client";

export default function TeacherDashboardPage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN", "WEBINAR_HOST"]}
        description="Login with a teacher, admin, or webinar host account to create and manage quizzes."
        title="Teacher Dashboard"
      >
        {(session) => <TeacherDashboardClient session={session} />}
      </SessionGate>
    </main>
  );
}
