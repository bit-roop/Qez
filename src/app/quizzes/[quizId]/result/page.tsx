"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { QuizResultClient } from "@/components/student/quiz-result-client";

type QuizResultPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizResultPage({ params }: QuizResultPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate description="Login to review your quiz result." title="Quiz Result">
        {() => <QuizResultClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
