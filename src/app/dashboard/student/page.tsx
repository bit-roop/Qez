"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { StudentDashboardClient } from "@/components/student/student-dashboard-client";

export default function StudentDashboardPage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["STUDENT"]}
        description="Login with a student account to join quizzes and start attempts."
        title="Student Dashboard"
      >
        {(session) => <StudentDashboardClient session={session} />}
      </SessionGate>
    </main>
  );
}
