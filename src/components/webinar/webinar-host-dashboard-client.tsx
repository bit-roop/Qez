"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, clearSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type WebinarQuiz = {
  id: string;
  title: string;
  description?: string | null;
  state: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  mode: "ACADEMIC" | "WEBINAR";
  joinCode: string;
  startsAt: string;
  endsAt: string;
  allowLeaderboard: boolean;
  showResultsToStudents: boolean;
  _count: {
    attempts: number;
    questions: number;
  };
};

type ListQuizResponse = { quizzes: WebinarQuiz[] };
type UpdateQuizResponse = { quiz: WebinarQuiz };

type WebinarHostDashboardClientProps = {
  session: AuthSession;
};

async function copyQuizInvite(title: string, joinCode: string) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://qez.vercel.app";
  const joinLink = `${baseUrl}/?code=${joinCode}`;
  const message = `Hey, join the webinar quiz "${title}" on Qez.\nOpen ${joinLink}\nYour room code is: ${joinCode}`;
  await navigator.clipboard.writeText(message);
}

const WAITING_ROOM_COUNTDOWN_MS = 45 * 1000;

export function WebinarHostDashboardClient({ session }: WebinarHostDashboardClientProps) {
  const [quizzes, setQuizzes] = useState<WebinarQuiz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const liveQuiz = quizzes.find((quiz) => quiz.state === "ACTIVE") ?? null;

  function buildLiveStartPayload(quiz: WebinarQuiz) {
    const durationMs =
      Math.max(new Date(quiz.endsAt).getTime() - new Date(quiz.startsAt).getTime(), 0) ||
      1000 * 60 * 10;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationMs);

    return {
      state: "ACTIVE" as const,
      allowLeaderboard: true,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    };
  }

  function buildWaitingRoomPayload(quiz: WebinarQuiz) {
    const durationMs =
      Math.max(new Date(quiz.endsAt).getTime() - new Date(quiz.startsAt).getTime(), 0) ||
      1000 * 60 * 10;
    const startsAt = new Date(Date.now() + WAITING_ROOM_COUNTDOWN_MS);
    const endsAt = new Date(startsAt.getTime() + durationMs);

    return {
      state: "ACTIVE" as const,
      allowLeaderboard: true,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    };
  }

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setIsLoading(true);
        const data = await apiFetch<ListQuizResponse>("/api/quizzes", { method: "GET" });
        setQuizzes(data.quizzes.filter((quiz) => quiz.mode === "WEBINAR"));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load webinar quizzes.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuizzes();
  }, []);

  useEffect(() => {
    const activeEndedQuiz = quizzes.find(
      (quiz) => quiz.state === "ACTIVE" && new Date(quiz.endsAt).getTime() <= Date.now()
    );

    if (!activeEndedQuiz) {
      return;
    }

    void updateQuizState(activeEndedQuiz.id, "COMPLETED");
  }, [quizzes]);

  async function updateQuizState(
    quizId: string,
    state: WebinarQuiz["state"],
    extra?: Record<string, unknown>
  ) {
    try {
      setError(null);
      setMessage(null);
      const data = await apiFetch<UpdateQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({ state, allowLeaderboard: true, ...extra })
      });
      setQuizzes((current) => current.map((quiz) => (quiz.id === quizId ? data.quiz : quiz)));
      setMessage(`Webinar quiz moved to ${state.toLowerCase()}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update webinar quiz.");
    }
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero dashboard-hero--webinar">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Live Control</span>
          <h1>Run webinar rounds from a dedicated host space.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. Webinar hosts only see webinar quizzes,
            live controls, rankings, and winner actions here.
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="secondary-link button-reset"
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="metric-card">
          <strong>{quizzes.length}</strong>
          <span>Webinar quizzes</span>
        </article>
        <article className="metric-card">
          <strong>{liveQuiz ? 1 : 0}</strong>
          <span>Live rounds now</span>
        </article>
        <article className="metric-card">
          <strong>{quizzes.reduce((sum, quiz) => sum + quiz._count.attempts, 0)}</strong>
          <span>Total webinar attempts</span>
        </article>
      </section>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="webinar-board-grid webinar-board-grid--single">
        <article className="card webinar-focus-card">
          <span className="eyebrow">Host Queue</span>
          <h2>{liveQuiz ? "Current live webinar" : "Webinar quiz library"}</h2>
          <p className="section-copy">
            Webinar quizzes are created and managed only by webinar hosts. Teachers no longer get live-control actions.
          </p>

          <div className="quiz-actions">
            <Link className="primary-button" href="/dashboard/host/create">
              Create webinar quiz
            </Link>
          </div>

          {isLoading ? <p className="section-copy">Loading webinar quizzes...</p> : null}

          {!isLoading && quizzes.length === 0 ? (
            <div className="empty-state">
              <h3>No webinar quizzes yet</h3>
              <p className="section-copy">
                Use your webinar-host account to create webinar quizzes. If you want, I can add a separate host create screen next.
              </p>
            </div>
          ) : null}

          <div className="quiz-list">
            {quizzes.map((quiz) => (
              <article className="quiz-list-item webinar-quiz-card" key={quiz.id}>
                {(() => {
                  const now = Date.now();
                  const startsAtMs = new Date(quiz.startsAt).getTime();
                  const endsAtMs = new Date(quiz.endsAt).getTime();
                  const isWaitingRoom = quiz.state === "ACTIVE" && now < startsAtMs;
                  const isLiveRound =
                    quiz.state === "ACTIVE" && now >= startsAtMs && now < endsAtMs;
                  const isCompleted = quiz.state === "COMPLETED" || now >= endsAtMs;

                  return (
                    <>
                <div className="quiz-list-meta">
                  <span className={`pill ${isCompleted ? "pill-warning" : isLiveRound ? "pill-active" : isWaitingRoom ? "pill-warning-critical" : `pill-${quiz.state.toLowerCase()}`}`}>
                    {isCompleted ? "COMPLETED" : isLiveRound ? "LIVE" : isWaitingRoom ? "WAITING ROOM" : quiz.state}
                  </span>
                  <span className="pill pill--webinar">WEBINAR</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description || "No description provided."}</p>
                <dl className="quiz-stats">
                  <div>
                    <dt>Join code</dt>
                    <dd>{quiz.joinCode}</dd>
                  </div>
                  <div>
                    <dt>Questions</dt>
                    <dd>{quiz._count.questions}</dd>
                  </div>
                  <div>
                    <dt>Attempts</dt>
                    <dd>{quiz._count.attempts}</dd>
                  </div>
                </dl>
                <div className="quiz-actions">
                  <Link className="primary-button" href={`/quizzes/${quiz.id}/host`}>
                    Live control
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/certificates`}>
                    Winners
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/analytics`}>
                    Analytics
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/leaderboard`}>
                    Leaderboard
                  </Link>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      void copyQuizInvite(quiz.title, quiz.joinCode);
                      setMessage(`Invite copied for "${quiz.title}".`);
                    }}
                    type="button"
                  >
                    Copy link
                  </button>
                  <button
                    className={isWaitingRoom ? "primary-button" : "secondary-button"}
                    disabled={isWaitingRoom || isLiveRound || isCompleted}
                    onClick={() => updateQuizState(quiz.id, "ACTIVE", buildWaitingRoomPayload(quiz))}
                    type="button"
                  >
                    Open waiting room
                  </button>
                  <button
                    className={isLiveRound ? "primary-button" : "secondary-button"}
                    disabled={isCompleted}
                    onClick={() => updateQuizState(quiz.id, "ACTIVE", buildLiveStartPayload(quiz))}
                    type="button"
                  >
                    Start round now
                  </button>
                  <button
                    className={isCompleted ? "primary-button" : "secondary-button"}
                    disabled
                    onClick={() => updateQuizState(quiz.id, "COMPLETED")}
                    type="button"
                  >
                    {isCompleted ? "Completed" : "Auto-completes"}
                  </button>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
