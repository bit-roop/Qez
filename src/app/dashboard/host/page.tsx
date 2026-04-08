"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { WebinarHostDashboardClient } from "@/components/webinar/webinar-host-dashboard-client";

export default function WebinarHostDashboardPage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["WEBINAR_HOST", "ADMIN"]}
        description="Login with a webinar host or admin account to create and control live event quizzes."
        title="Webinar Host Dashboard"
      >
        {(session) => <WebinarHostDashboardClient session={session} />}
      </SessionGate>
    </main>
  );
}
