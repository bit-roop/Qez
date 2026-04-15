"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { QuizAttemptClient } from "@/components/student/quiz-attempt-client";

type QuizAttemptPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizAttemptPage({ params }: QuizAttemptPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell page-shell--attempt">
      <SessionGate
        allowedRoles={["STUDENT"]}
        description="Login with a student account to attempt this quiz."
        title="Quiz Attempt"
      >
        {() => <QuizAttemptClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
