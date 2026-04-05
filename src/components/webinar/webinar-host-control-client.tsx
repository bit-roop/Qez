"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type HostQuiz = {
  id: string;
  title: string;
  description?: string | null;
  mode: "ACADEMIC" | "WEBINAR";
  state: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  joinCode: string;
  startsAt: string;
  endsAt: string;
  allowLeaderboard: boolean;
  leaderboardVisibility: "HIDDEN" | "TOP_10" | "FULL";
  showResultsToStudents: boolean;
  _count: {
    attempts: number;
  };
};

type HostQuizResponse = {
  quiz: HostQuiz;
};

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
  topPerformers: {
    id: string;
    rank: number;
    pointsAwarded: number;
    totalScore: number;
    totalTimeSeconds: number;
    user: {
      id: string;
      name: string;
    };
  }[];
  totalParticipants: number;
  lastUpdatedAt: string;
};

type UpdateQuizResponse = {
  quiz: HostQuiz;
};

type WebinarHostControlClientProps = {
  quizId: string;
  session: AuthSession;
};

export function WebinarHostControlClient({ quizId, session }: WebinarHostControlClientProps) {
  const [quiz, setQuiz] = useState<HostQuiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealWinners, setRevealWinners] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setIsLoading(true);
        const [quizData, leaderboardData] = await Promise.all([
          apiFetch<HostQuizResponse>(`/api/quizzes/${quizId}`, { method: "GET" }),
          apiFetch<LeaderboardData>(`/api/quizzes/${quizId}/leaderboard`, { method: "GET" })
        ]);

        if (!active) {
          return;
        }

        setQuiz(quizData.quiz);
        setLeaderboard(leaderboardData);
        setError(null);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to load host control room.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [quizId]);

  const podium = useMemo(() => leaderboard?.topPerformers ?? [], [leaderboard]);

  async function patchQuiz(body: Record<string, unknown>, successMessage: string) {
    try {
      const data = await apiFetch<UpdateQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      setQuiz(data.quiz);
      setMessage(successMessage);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update webinar quiz.");
    }
  }

  if (isLoading) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Host Control</span>
          <h1>Loading webinar control room...</h1>
        </article>
      </section>
    );
  }

  if (error || !quiz || !leaderboard) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Host Control</span>
          <h1>We couldn&apos;t open this webinar room.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
          <Link className="secondary-button" href="/dashboard/host">
            Back to host dashboard
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="leaderboard-shell webinar-room-shell">
      <article className="leaderboard-panel leaderboard-panel--hero webinar-room-hero">
        <div>
          <span className="eyebrow">Control Room</span>
          <h1>{quiz.title}</h1>
          <p className="section-copy">
            Hosting as <strong>{session.user.name}</strong>. Keep this room open while the public board updates every few seconds.
          </p>
          <div className="quiz-actions">
            <button
              className={quiz.state === "ACTIVE" ? "primary-button" : "secondary-button"}
              disabled={quiz.state === "ACTIVE"}
              onClick={() => patchQuiz({ state: "ACTIVE", allowLeaderboard: true }, "Webinar round is now live.")}
              type="button"
            >
              Go live
            </button>
            <button
              className={quiz.state === "COMPLETED" ? "primary-button" : "secondary-button"}
              disabled={quiz.state === "COMPLETED"}
              onClick={() => patchQuiz({ state: "COMPLETED" }, "Webinar round completed.")}
              type="button"
            >
              Close round
            </button>
            <button
              className={quiz.leaderboardVisibility === "FULL" ? "primary-button" : "secondary-button"}
              onClick={() =>
                patchQuiz(
                  { allowLeaderboard: true, leaderboardVisibility: quiz.leaderboardVisibility === "FULL" ? "TOP_10" : "FULL" },
                  quiz.leaderboardVisibility === "FULL"
                    ? "Leaderboard limited to top 10."
                    : "Full leaderboard is now visible."
                )
              }
              type="button"
            >
              {quiz.leaderboardVisibility === "FULL" ? "Top 10 only" : "Show full board"}
            </button>
            <button
              className={revealWinners ? "primary-button" : "secondary-button"}
              onClick={() => setRevealWinners((current) => !current)}
              type="button"
            >
              {revealWinners ? "Hide podium" : "Reveal winners"}
            </button>
          </div>
        </div>

        <div className="webinar-room-spotlight">
          <span className="question-badge">Live status</span>
          <strong>{quiz.state}</strong>
          <span>Join code {quiz.joinCode}</span>
          <span>{leaderboard.totalParticipants} participants on the board</span>
          <span>Last refresh {new Date(leaderboard.lastUpdatedAt).toLocaleTimeString()}</span>
        </div>
      </article>

      {message ? <p className="form-success">{message}</p> : null}

      <section className="webinar-board-grid">
        <article className="leaderboard-panel webinar-podium-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Stage Podium</span>
              <h2>{revealWinners ? "Winner reveal is live" : "Top performers warming up"}</h2>
            </div>
          </div>

          <div className={`webinar-podium ${revealWinners ? "webinar-podium--revealed" : ""}`}>
            {podium.map((entry, index) => (
              <article
                className={`webinar-podium-card webinar-podium-card--${index + 1}`}
                key={entry.id}
              >
                <span className="webinar-podium-rank">#{entry.rank}</span>
                <strong>{entry.user.name}</strong>
                <span>{entry.pointsAwarded} pts</span>
                <span>{entry.totalScore} score</span>
                <span>{entry.totalTimeSeconds}s</span>
              </article>
            ))}

            {podium.length === 0 ? (
              <div className="empty-state">
                <h3>No submissions yet</h3>
                <p className="section-copy">Once attendees submit, the podium will fill automatically.</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className="leaderboard-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Host Shortcuts</span>
              <h2>Live event actions</h2>
            </div>
          </div>

          <div className="webinar-shortcut-grid">
            <Link className="secondary-button" href={`/quizzes/${quizId}/leaderboard`}>
              Open public leaderboard
            </Link>
            <Link className="secondary-button" href={`/quizzes/${quizId}/certificates`}>
              Winner certificates
            </Link>
            <a className="secondary-button" href={`/api/quizzes/${quizId}/winners/export`}>
              Export winners CSV
            </a>
            <Link className="secondary-button" href={`/quizzes/${quizId}/analytics`}>
              Open analytics
            </Link>
            <Link className="secondary-button" href={`/quizzes/${quizId}/monitor`}>
              Review flags
            </Link>
            <Link className="secondary-button" href={`/quizzes/${quizId}`}>
              Open quiz detail
            </Link>
          </div>
        </article>
      </section>

      <article className="leaderboard-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Live Ranking Feed</span>
            <h2>Current standings</h2>
          </div>
        </div>

        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-row--head">
            <span>Rank</span>
            <span>Name</span>
            <span>Points</span>
            <span>Score</span>
            <span>Time</span>
          </div>
          {leaderboard.entries.map((entry) => (
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
