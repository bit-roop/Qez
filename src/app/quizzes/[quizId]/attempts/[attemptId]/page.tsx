"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { AttemptReviewClient } from "@/components/teacher/attempt-review-client";

type AttemptReviewPageProps = {
  params: Promise<{
    quizId: string;
    attemptId: string;
  }>;
};

export default function AttemptReviewPage({ params }: AttemptReviewPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN", "WEBINAR_HOST"]}
        description="Login with a teacher, admin, or webinar host account to inspect attempts."
        title="Attempt Review"
      >
        {() => (
          <AttemptReviewClient
            attemptId={resolvedParams.attemptId}
            quizId={resolvedParams.quizId}
          />
        )}
      </SessionGate>
    </main>
  );
}
