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
import {
  MotionItem,
  MotionPage,
  MotionSection,
  MotionStagger
} from "@/components/motion/motion-shell";
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
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setQuizCode(code.toUpperCase().slice(0, 6));
    }

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
      <MotionPage className="page-shell home-shell">
        <MotionSection className="home-hero home-hero--guest">
          <div className="home-guest-layout">
            <div className="home-copy">
              <span className="eyebrow">Qez</span>
              <h1>Build, host, and scale competitive quizzes — all in one system.</h1>
              <p className="section-copy">
                Run timed assessments, live webinar competitions, and real-time leaderboards with server-side scoring and built-in anti-cheat tracking.
              </p>
              <div className="hero-actions">
                <Link className="primary-link" href="/register">
                  Get Started
                </Link>
                <Link className="secondary-link" href="/#features">
                  View Demo
                </Link>
              </div>
            </div>

            <aside className="home-guest-side">
              <article className="home-card home-card--accent">
                <span className="question-badge">Feature Summary</span>
                <h2>Two modes. One powerful engine.</h2>
                <ul className="home-feature-list">
                  <li>Academic mode with controlled access, analytics, and result locking</li>
                  <li>Webinar mode with live ranking, speed-based scoring, and podium results</li>
                  <li>Secure backend scoring with anti-cheat tracking and submission validation</li>
                </ul>
              </article>
            </aside>
          </div>

          <MotionStagger className="home-grid" id="features">
            <MotionItem className="home-card home-card--accent" id="academic-mode">
              <span className="question-badge">Academic Mode</span>
              <h2>Structured assessments</h2>
              <p>Conduct timed quizzes with full control over attempts, scoring, and result visibility.</p>
            </MotionItem>
            <MotionItem className="home-card" id="webinar-mode">
              <span className="question-badge">Webinar Mode</span>
              <h2>Live competitive rounds</h2>
              <p>Run real-time quiz events with instant rankings, speed-based scoring, and winner tracking.</p>
            </MotionItem>
            <MotionItem className="home-card" id="leaderboard">
              <span className="question-badge">Backend Strength</span>
              <h2>Reliable by design</h2>
              <p>Transaction-safe submissions, role-based access, and scalable PostgreSQL architecture.</p>
            </MotionItem>
          </MotionStagger>

          <MotionSection className="home-why card">
            <span className="eyebrow">Why Qez</span>
            <h2>Built for real use — not just demos</h2>
            <MotionStagger className="home-why-grid">
              <MotionItem className="preview-card preview-card--feature">
                <p className="section-copy">Server-side scoring with no client manipulation.</p>
              </MotionItem>
              <MotionItem className="preview-card preview-card--feature">
                <p className="section-copy">Anti-cheat tracking with tab-switch detection.</p>
              </MotionItem>
              <MotionItem className="preview-card preview-card--feature">
                <p className="section-copy">Scalable architecture using PostgreSQL, Prisma, and Neon.</p>
              </MotionItem>
              <MotionItem className="preview-card preview-card--feature">
                <p className="section-copy">Works across desktop and mobile.</p>
              </MotionItem>
            </MotionStagger>
          </MotionSection>
        </MotionSection>
      </MotionPage>
    );
  }

  const dashboardPath = getDefaultDashboardPath(session.user.role);
  const isStudent = session.user.role === "STUDENT";
  const isHost = session.user.role === "WEBINAR_HOST";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <MotionPage className="page-shell home-shell">
      <MotionSection className="home-hero">
        <div className="home-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>{session.user.name}, what do you want to do next?</h1>
          <p className="section-copy">Quick access only. No extra clutter.</p>
        </div>

        <MotionStagger className="home-grid">
          {isStudent ? (
            <>
              <MotionItem className="home-card home-card--accent">
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
              </MotionItem>

              <MotionItem className="home-card">
                <span className="question-badge">Student</span>
                <h2>Open dashboard</h2>
                <p>See joined quizzes, leaderboards, and your quiz tools.</p>
                <Link className="secondary-button" href={dashboardPath}>
                  Go to student dashboard
                </Link>
              </MotionItem>
            </>
          ) : isHost ? (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Live Control</span>
                <h2>Run the stage in real time</h2>
                <p>Open your live event dashboard, start rounds, and reveal winners with the public board ready.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open live control
                </Link>
              </MotionItem>

              <MotionItem className="home-card">
                <span className="question-badge">Studio</span>
                <h2>Create the next webinar quiz</h2>
                <p>Jump into quiz setup, prepare new rounds, and keep your live queue ready.</p>
                <Link className="secondary-button" href="/dashboard/host/create">
                  Open webinar studio
                </Link>
              </MotionItem>
            </>
          ) : isAdmin ? (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Admin</span>
                <h2>Open the control center</h2>
                <p>Monitor users, quiz activity, and suspicious attempts from the platform overview.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open admin dashboard
                </Link>
              </MotionItem>

              <MotionItem className="home-card">
                <span className="question-badge">Oversight</span>
                <h2>Review the creation workspace</h2>
                <p>Jump into the quiz studio if you need to inspect creator-facing flows directly.</p>
                <Link className="secondary-button" href="/dashboard/teacher">
                  Open quiz studio
                </Link>
              </MotionItem>
            </>
          ) : (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Teacher</span>
                <h2>Create or manage quizzes</h2>
                <p>Open your quiz library, edit drafts, and activate live quizzes.</p>
                <Link className="primary-button" href={dashboardPath}>
                  Open teacher dashboard
                </Link>
              </MotionItem>

              <MotionItem className="home-card">
                <span className="question-badge">Workspace</span>
                <h2>Run the next session fast</h2>
                <p>One place for quiz setup, analytics, leaderboard, and flagged attempts.</p>
                <Link className="secondary-button" href={dashboardPath}>
                  Go to workspace
                </Link>
              </MotionItem>
            </>
          )}
        </MotionStagger>
      </MotionSection>
    </MotionPage>
  );
}
