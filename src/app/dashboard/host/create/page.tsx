"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { WebinarQuizCreateClient } from "@/components/webinar/webinar-quiz-create-client";

export default function WebinarCreatePage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["WEBINAR_HOST", "ADMIN"]}
        description="Login with a webinar host or admin account to create webinar quizzes."
        title="Create Webinar Quiz"
      >
        {(session) => <WebinarQuizCreateClient session={session} />}
      </SessionGate>
    </main>
  );
}
