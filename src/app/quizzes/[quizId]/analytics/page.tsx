"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { QuizAnalyticsClient } from "@/components/teacher/quiz-analytics-client";

type QuizAnalyticsPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizAnalyticsPage({ params }: QuizAnalyticsPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["TEACHER", "ADMIN", "WEBINAR_HOST"]}
        description="Login with a teacher, admin, or webinar host account to view analytics."
        title="Quiz Analytics"
      >
        {() => <QuizAnalyticsClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
