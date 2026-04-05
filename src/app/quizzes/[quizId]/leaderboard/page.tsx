"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";

type QuizLeaderboardPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizLeaderboardPage({ params }: QuizLeaderboardPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        description="Login to view this leaderboard."
        title="Quiz Leaderboard"
      >
        {() => <LeaderboardClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
