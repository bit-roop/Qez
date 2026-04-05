"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
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
  showResultsToStudents: boolean;
  allowLeaderboard: boolean;
  _count: {
    attempts: number;
    questions: number;
  };
};

type ListQuizResponse = {
  quizzes: WebinarQuiz[];
};

type UpdateQuizResponse = {
  quiz: WebinarQuiz;
};

type WebinarHostDashboardClientProps = {
  session: AuthSession;
};

export function WebinarHostDashboardClient({ session }: WebinarHostDashboardClientProps) {
  const [quizzes, setQuizzes] = useState<WebinarQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const webinarQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.mode === "WEBINAR"),
    [quizzes]
  );

  const activeQuiz = webinarQuizzes.find((quiz) => quiz.state === "ACTIVE") ?? null;
  const upcomingQuiz = webinarQuizzes.find((quiz) => quiz.state === "DRAFT") ?? null;

  const stats = {
    total: webinarQuizzes.length,
    live: webinarQuizzes.filter((quiz) => quiz.state === "ACTIVE").length,
    participants: webinarQuizzes.reduce((sum, quiz) => sum + (quiz._count?.attempts ?? 0), 0)
  };

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setIsLoading(true);
        const data = await apiFetch<ListQuizResponse>("/api/quizzes", { method: "GET" });
        setQuizzes(data.quizzes);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load webinar quizzes.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuizzes();
  }, []);

  async function updateQuizState(quizId: string, state: WebinarQuiz["state"]) {
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<UpdateQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({ state, allowLeaderboard: true })
      });

      setQuizzes((current) => current.map((quiz) => (quiz.id === quizId ? data.quiz : quiz)));
      setMessage(`Webinar quiz moved to ${state.toLowerCase()}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update webinar state.");
    }
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero dashboard-hero--webinar">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Webinar Host Room</span>
          <h1>Run the live challenge without leaving the stage view.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. Launch webinar quizzes, keep the leaderboard visible,
            and jump straight into the winner reveal screen.
          </p>
        </div>

        <div className="webinar-host-highlight">
          <span className="question-badge">Live Ops</span>
          <strong>{activeQuiz ? activeQuiz.title : "No webinar is live yet"}</strong>
          <span>{activeQuiz ? `Join code ${activeQuiz.joinCode}` : "Activate a webinar quiz to start the event."}</span>
          {activeQuiz ? (
            <Link className="primary-button" href={`/quizzes/${activeQuiz.id}/host`}>
              Open host control
            </Link>
          ) : (
            <Link className="secondary-button" href="/dashboard/teacher">
              Create webinar quiz
            </Link>
          )}
        </div>
      </section>

      <section className="stats-grid">
        <article className="metric-card">
          <strong>{stats.total}</strong>
          <span>Total webinar quizzes</span>
        </article>
        <article className="metric-card">
          <strong>{stats.live}</strong>
          <span>Currently live</span>
        </article>
        <article className="metric-card">
          <strong>{stats.participants}</strong>
          <span>Participants recorded</span>
        </article>
      </section>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="webinar-board-grid">
        <article className="card webinar-focus-card">
          <span className="eyebrow">On Deck</span>
          <h2>{activeQuiz ? "Current live webinar" : "Next webinar to prepare"}</h2>
          {activeQuiz || upcomingQuiz ? (
            <div className="webinar-focus-stack">
              <div className="webinar-focus-meta">
                <span className={`pill ${activeQuiz ? "pill-active" : "pill-draft"}`}>
                  {(activeQuiz ?? upcomingQuiz)?.state}
                </span>
                <span className="pill pill--webinar">WEBINAR</span>
              </div>
              <strong>{(activeQuiz ?? upcomingQuiz)?.title}</strong>
              <p className="section-copy">
                {(activeQuiz ?? upcomingQuiz)?.description || "No description provided yet."}
              </p>
              <div className="quiz-stats">
                <div>
                  <dt>Join code</dt>
                  <dd>{(activeQuiz ?? upcomingQuiz)?.joinCode}</dd>
                </div>
                <div>
                  <dt>Questions</dt>
                  <dd>{(activeQuiz ?? upcomingQuiz)?._count?.questions ?? 0}</dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>{(activeQuiz ?? upcomingQuiz)?._count?.attempts ?? 0}</dd>
                </div>
              </div>
              <div className="quiz-actions">
                <Link className="primary-button" href={`/quizzes/${(activeQuiz ?? upcomingQuiz)?.id}/host`}>
                  Open control room
                </Link>
                {!activeQuiz && upcomingQuiz ? (
                  <button
                    className="secondary-button"
                    onClick={() => updateQuizState(upcomingQuiz.id, "ACTIVE")}
                    type="button"
                  >
                    Activate now
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No webinar quizzes yet</h3>
              <p className="section-copy">Create a webinar-mode quiz from the teacher workspace to start hosting.</p>
            </div>
          )}
        </article>

        <article className="card dashboard-card--full">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Host Queue</span>
              <h2>Webinar library</h2>
            </div>
          </div>

          {isLoading ? <p className="section-copy">Loading webinar quizzes...</p> : null}

          {!isLoading && webinarQuizzes.length === 0 ? (
            <div className="empty-state">
              <h3>No webinar quizzes found</h3>
              <p className="section-copy">Switch a quiz to webinar mode to make it appear here.</p>
            </div>
          ) : null}

          <div className="quiz-list">
            {webinarQuizzes.map((quiz) => (
              <article className="quiz-list-item webinar-quiz-card" key={quiz.id}>
                <div className="quiz-list-meta">
                  <span className={`pill pill-${quiz.state.toLowerCase()}`}>{quiz.state}</span>
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
                    <dt>Attempts</dt>
                    <dd>{quiz._count?.attempts ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Leaderboard</dt>
                    <dd>{quiz.allowLeaderboard ? "On" : "Off"}</dd>
                  </div>
                </dl>
                <div className="quiz-actions">
                  <Link className="primary-button" href={`/quizzes/${quiz.id}/host`}>
                    Host room
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/leaderboard`}>
                    Public board
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/analytics`}>
                    Analytics
                  </Link>
                  {quiz.state !== "ACTIVE" ? (
                    <button
                      className="secondary-button"
                      onClick={() => updateQuizState(quiz.id, "ACTIVE")}
                      type="button"
                    >
                      Go live
                    </button>
                  ) : (
                    <button
                      className="secondary-button"
                      onClick={() => updateQuizState(quiz.id, "COMPLETED")}
                      type="button"
                    >
                      End live round
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
