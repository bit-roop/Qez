"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { SuspiciousAttemptsClient } from "@/components/teacher/suspicious-attempts-client";

type QuizMonitorPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizMonitorPage({ params }: QuizMonitorPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN", "WEBINAR_HOST"]}
        description="Login with a teacher, admin, or webinar host account to review suspicious attempts."
        title="Suspicious Attempt Review"
      >
        {() => <SuspiciousAttemptsClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
