"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  apiFetch,
  getDefaultDashboardPath,
  loadSession,
  subscribeToSessionChanges
} from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type JoinQuizResponse = {
  quiz: {
    id: string;
  };
};

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [quizCode, setQuizCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setSession(loadSession());

    return subscribeToSessionChanges(() => {
      setSession(loadSession());
    });
  }, []);

  async function handleQuickJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError(null);
    setIsJoining(true);

    try {
      const data = await apiFetch<JoinQuizResponse>("/api/quizzes/join", {
        method: "POST",
        body: JSON.stringify({
          joinCode: quizCode.trim().toUpperCase()
        })
      });

      router.push(`/quizzes/${data.quiz.id}/attempt`);
    } catch (caughtError) {
      setJoinError(caughtError instanceof Error ? caughtError.message : "Unable to find quiz.");
    } finally {
      setIsJoining(false);
    }
  }

  if (!session) {
    return (
      <main className="page-shell home-shell">
        <section className="home-hero home-hero--guest">
          <div className="home-copy">
            <span className="eyebrow">Qez</span>
            <h1>Fast quizzes for classrooms and live events.</h1>
            <p className="section-copy">
              Create, activate, attempt, and score from one clean workflow.
            </p>
            <div className="hero-actions">
              <Link className="primary-link" href="/register">
                Create account
              </Link>
              <Link className="secondary-link" href="/login">
                Login
              </Link>
            </div>
          </div>

          <div className="home-grid">
            <article className="home-card home-card--accent">
              <span className="question-badge">Academic</span>
              <h2>Teacher-controlled assessments</h2>
              <p>Timed MCQs, one secure attempt, private results, and analytics.</p>
            </article>
            <article className="home-card">
              <span className="question-badge">Webinar</span>
              <h2>Speed-based live competitions</h2>
              <p>Fastest correct answers rise on the leaderboard and earn points.</p>
            </article>
          </div>
        </section>
      </main>
    );
  }

  const dashboardPath = getDefaultDashboardPath(session.user.role);
  const isStudent = session.user.role === "STUDENT";
  const isHost = session.user.role === "WEBINAR_HOST";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="page-shell home-shell">
      <section className="home-hero">
        <div className="home-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>{session.user.name}, what do you want to do next?</h1>
          <p className="section-copy">Quick access only. No extra clutter.</p>
        </div>

        <div className="home-grid">
          {isStudent ? (
            <>
              <article className="home-card home-card--accent">
                <span className="question-badge">Quick Join</span>
                <h2>Enter quiz code</h2>
                <form className="home-join-form" onSubmit={handleQuickJoin}>
                  <input
                    maxLength={6}
                    onChange={(event) => setQuizCode(event.target.value.toUpperCase())}
                    placeholder="6-character code"
                    required
                    type="text"
                    value={quizCode}
                  />
                  <button className="primary-button" disabled={isJoining} type="submit">
                    {isJoining ? "Joining..." : "Join quiz"}
                  </button>
                </form>
                {joinError ? <p className="status-banner status-banner--error">{joinError}</p> : null}
              </article>

              <article className="home-card">
                <span className="question-badge">Student</span>
                <h2>Open dashboard</h2>
                <p>See joined quizzes, leaderboards, and your quiz tools.</p>
                <Link className="secondary-button" href={dashboardPath}>
                  Go to student dashboard
                </Link>
              </article>
            </>
          ) : isHost ? (
            <>
              <article className="home-card home-card--accent">
                <span className="question-badge">Live Control</span>
                <h2>Run the stage in real time</h2>
                <p>Open your live event dashboard, start rounds, and reveal winners with the public board ready.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open live control
                </Link>
              </article>

              <article className="home-card">
                <span className="question-badge">Studio</span>
                <h2>Create the next webinar quiz</h2>
                <p>Jump into quiz setup, prepare new rounds, and keep your live queue ready.</p>
                <Link className="secondary-button" href="/dashboard/host/create">
                  Open webinar studio
                </Link>
              </article>
            </>
          ) : isAdmin ? (
            <>
              <article className="home-card home-card--accent">
                <span className="question-badge">Admin</span>
                <h2>Open the control center</h2>
                <p>Monitor users, quiz activity, and suspicious attempts from the platform overview.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open admin dashboard
                </Link>
              </article>

              <article className="home-card">
                <span className="question-badge">Oversight</span>
                <h2>Review the creation workspace</h2>
                <p>Jump into the quiz studio if you need to inspect creator-facing flows directly.</p>
                <Link className="secondary-button" href="/dashboard/teacher">
                  Open quiz studio
                </Link>
              </article>
            </>
          ) : (
            <>
              <article className="home-card home-card--accent">
                <span className="question-badge">Teacher</span>
                <h2>Create or manage quizzes</h2>
                <p>Open your quiz library, edit drafts, and activate live quizzes.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open teacher dashboard
                </Link>
              </article>

              <article className="home-card">
                <span className="question-badge">Workspace</span>
                <h2>Run the next session fast</h2>
                <p>One place for quiz setup, analytics, leaderboard, and flagged attempts.</p>
                <Link className="secondary-button" href={dashboardPath}>
                  Go to workspace
                </Link>
              </article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
