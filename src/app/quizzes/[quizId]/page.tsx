"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { QuizDetailClient } from "@/components/teacher/quiz-detail-client";

type QuizDetailPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizDetailPage({ params }: QuizDetailPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN", "WEBINAR_HOST"]}
        description="Login with a teacher, admin, or webinar host account to review this quiz."
        title="Quiz Workspace"
      >
        {() => <QuizDetailClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
