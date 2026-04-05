"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type LeaderboardData = {
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
    allowLeaderboard: boolean;
    leaderboardVisibility: "HIDDEN" | "TOP_10" | "FULL";
  };
  entries: {
    id: string;
    rank: number;
    pointsAwarded: number;
    totalScore: number;
    totalTimeSeconds: number;
    suspicious: boolean;
    submittedAt?: string | null;
    user: {
      id: string;
      name: string;
    };
  }[];
  myEntry?: {
    rank: number;
    totalScore: number;
    totalTimeSeconds: number;
    suspicious: boolean;
    user: {
      id: string;
      name: string;
    };
  } | null;
  totalParticipants: number;
};

type LeaderboardClientProps = {
  quizId: string;
};

export function LeaderboardClient({ quizId }: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        const result = await apiFetch<LeaderboardData>(`/api/quizzes/${quizId}/leaderboard`, {
          method: "GET"
        });

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load leaderboard.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboard();
    const interval = window.setInterval(() => {
      void loadLeaderboard();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [quizId]);

  if (isLoading) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Leaderboard</span>
          <h1>Loading live standings...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Leaderboard</span>
          <h1>We couldn&apos;t open this leaderboard.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
          <Link className="secondary-button" href="/dashboard/student">
            Back
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="leaderboard-shell">
      <article className="leaderboard-panel leaderboard-panel--hero">
        <div>
          <span className="eyebrow">Live Standings</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            {data.quiz.mode === "WEBINAR"
              ? "Fastest correct answers rise to the top. Rankings refresh automatically."
              : "Academic rankings are sorted by score first and time second."}
          </p>
        </div>

        <div className="leaderboard-hero-metrics">
          <article className="metric-card">
            <strong>{data.totalParticipants}</strong>
            <span>Total participants</span>
          </article>
          <article className="metric-card">
            <strong>{data.quiz.leaderboardVisibility}</strong>
            <span>Visibility mode</span>
          </article>
        </div>
      </article>

      {data.myEntry ? (
        <article className="leaderboard-panel leaderboard-panel--me">
          <span className="eyebrow">Your Position</span>
          <div className="leaderboard-me-grid">
            <article className="metric-card">
              <strong>#{data.myEntry.rank}</strong>
              <span>Rank</span>
            </article>
            <article className="metric-card">
              <strong>{data.myEntry.totalScore}</strong>
              <span>Score</span>
            </article>
            <article className="metric-card">
              <strong>{data.myEntry.totalTimeSeconds}s</strong>
              <span>Total time</span>
            </article>
          </div>
        </article>
      ) : null}

      <article className="leaderboard-panel">
        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-row--head">
            <span>Rank</span>
            <span>Name</span>
            <span>Points</span>
            <span>Score</span>
            <span>Time</span>
          </div>

          {data.entries.map((entry) => (
            <div className="leaderboard-row" key={entry.id}>
              <span className="leaderboard-rank">#{entry.rank}</span>
              <span>{entry.user.name}</span>
              <span>{entry.pointsAwarded}</span>
              <span>{entry.totalScore}</span>
              <span>{entry.totalTimeSeconds}s</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
