"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  apiFetch,
  getDefaultDashboardPath,
  loadSession,
  subscribeToSessionChanges,
} from "@/lib/client-auth";
import {
  MotionItem,
  MotionPage,
  MotionSection,
  MotionStagger,
} from "@/components/motion/motion-shell";
import { AuthSession } from "@/types/client-auth";

type JoinQuizResponse = {
  quiz: { id: string };
};

/* ─────────────────────────────────────────
   Tiny inline SVG icons (no extra deps)
───────────────────────────────────────── */
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 1.5L2.5 4.5V9C2.5 12.6 5.3 15.9 9 16.8C12.7 15.9 15.5 12.6 15.5 9V4.5L9 1.5Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9L8 11L12 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLive() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <path d="M4 4C2.3 5.7 1.5 7.2 1.5 9C1.5 10.8 2.3 12.3 4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 4C15.7 5.7 16.5 7.2 16.5 9C16.5 10.8 15.7 12.3 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.2 6.2C5.3 7.1 5 8 5 9C5 10 5.3 10.9 6.2 11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11.8 6.2C12.7 7.1 13 8 13 9C13 10 12.7 10.9 11.8 11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="10" width="3" height="6" rx="1" fill="currentColor" opacity=".7" />
      <rect x="7.5" y="6" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="13" y="2" width="3" height="14" rx="1" fill="currentColor" opacity=".5" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M10.5 1.5L3 10.5H9L7.5 16.5L15 7.5H9L10.5 1.5Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Role cards data
───────────────────────────────────────── */
const personaCards = [
  {
    id: "student",
    emoji: "🎓",
    label: "Student",
    colorClass: "persona-card--student",
    desc: "Join with a 6-char code, answer in real-time, see your rank instantly. No install needed.",
    features: ["Join any quiz in seconds", "Live rank & score", "Answer review after", "Works on any phone"],
  },
  {
    id: "teacher",
    emoji: "👩‍🏫",
    label: "Teacher",
    colorClass: "persona-card--teacher",
    desc: "Build timed assessments, lock results, control who can attempt, and dig into per-student analytics.",
    features: ["Quiz builder + timer control", "Access code management", "Per-student breakdown", "Anti-cheat activity log"],
  },
  {
    id: "host",
    emoji: "🎤",
    label: "Webinar Host",
    colorClass: "persona-card--host",
    desc: "Run competitive live events with speed-based scoring, dramatic podium reveals, and winner export.",
    features: ["Speed-scored live ranking", "Podium reveal mode", "Large-scale events", "Winner certificate export"],
  },
];

const howItWorksSteps = [
  { num: "01", title: "Create a quiz", desc: "Add questions, set a timer, pick Academic or Webinar mode." },
  { num: "02", title: "Share the code", desc: "Students join with a 6-digit code — must be signed in." },
  { num: "03", title: "Run it live", desc: "Watch submissions roll in on your real-time dashboard." },
  { num: "04", title: "See the results", desc: "Auto-scored leaderboard + per-student analytics, instantly." },
];

const trustPoints = [
  { icon: <IconShield />, text: "Server-side scoring — no client manipulation possible" },
  { icon: <IconLive />, text: "Real-time leaderboard via streaming" },
  { icon: <IconZap />, text: "Anti-cheat tab-switch detection built in" },
  { icon: <IconChart />, text: "Per-question analytics for teachers" },
];

/* ─────────────────────────────────────────
   Guest landing page
───────────────────────────────────────── */
function GuestHome() {
  return (
    <MotionPage className="page-shell home-shell">

      {/* ── HERO ─────────────────────────────────────── */}
      <MotionSection className="lp-hero" aria-label="Hero">
        <div className="lp-hero__copy">
          <span className="eyebrow lp-hero__badge">🎯 Built for real classrooms</span>
          <h1 className="lp-hero__h1">
            Run smarter quizzes for<br />
            <span className="lp-hero__h1-accent">every classroom.</span>
          </h1>
          <p className="lp-hero__sub section-copy">
            Timed assessments, live competitions, real-time leaderboards — with server-side scoring and built-in anti-cheat. For teachers, students, and webinar hosts.
          </p>
          <div className="lp-hero__ctas hero-actions">
            <Link href="/register" className="primary-link lp-cta-primary">
              Start for free →
            </Link>
            <Link href="#how-it-works" className="secondary-link">
              How it works
            </Link>
          </div>
          <div className="lp-trust">
            <div className="lp-trust__avatars" aria-hidden>
              <span style={{ background: "#4e46c8" }}>A</span>
              <span style={{ background: "#198f88" }}>M</span>
              <span style={{ background: "#d85f3d" }}>P</span>
              <span style={{ background: "#efb941" }}>R</span>
            </div>
            <p className="lp-trust__text">Used by <strong>2,400+ educators</strong> — free to start, no card needed</p>
          </div>
        </div>

        {/* Live preview card */}
        <aside className="lp-hero__preview" aria-label="Live quiz preview">
          <div className="lp-preview-card">
            <div className="lp-preview-card__header">
              <span className="question-badge">CS101 Final Exam</span>
              <span className="lp-live-badge">
                <span className="lp-live-dot" aria-hidden /> Live · 24 online
              </span>
            </div>

            <div className="lp-mode-tabs" role="tablist">
              <button className="lp-mode-tab lp-mode-tab--active" role="tab" aria-selected="true">🎓 Academic</button>
              <button className="lp-mode-tab" role="tab" aria-selected="false">🏆 Webinar</button>
            </div>

            <div className="lp-stats-row">
              <div className="lp-stat">
                <span className="lp-stat__label">Submitted</span>
                <strong className="lp-stat__val" style={{ color: "var(--z-violet)" }}>18 / 24</strong>
              </div>
              <div className="lp-stat">
                <span className="lp-stat__label">Avg score</span>
                <strong className="lp-stat__val" style={{ color: "var(--z-lime)" }}>74%</strong>
              </div>
              <div className="lp-stat">
                <span className="lp-stat__label">Time left</span>
                <strong className="lp-stat__val" style={{ color: "var(--z-yellow)" }}>4:20</strong>
              </div>
            </div>

            <div className="lp-leaderboard">
              <p className="lp-lb-label">Leaderboard</p>
              <div className="lp-lb-row lp-lb-row--gold">
                <span className="lp-lb-rank">🥇</span>
                <span className="lp-lb-name">Priya S.</span>
                <span className="lp-lb-score">96 pts</span>
                <span className="lp-lb-time">1:34</span>
              </div>
              <div className="lp-lb-row">
                <span className="lp-lb-rank lp-lb-rank--2">2</span>
                <span className="lp-lb-name">Rahul M.</span>
                <span className="lp-lb-score">91 pts</span>
                <span className="lp-lb-time">2:10</span>
              </div>
              <div className="lp-lb-row">
                <span className="lp-lb-rank lp-lb-rank--3">3</span>
                <span className="lp-lb-name">Ayesha K.</span>
                <span className="lp-lb-score">88 pts</span>
                <span className="lp-lb-time">2:58</span>
              </div>
            </div>
          </div>
        </aside>
      </MotionSection>

      {/* ── WHO IS IT FOR ─────────────────────────────── */}
      <MotionSection className="lp-section" id="who-its-for" aria-labelledby="for-heading">
        <div className="lp-section__head">
          <p className="lp-section__label">Who it's for</p>
          <h2 id="for-heading">One platform, three kinds of power users.</h2>
        </div>

        <MotionStagger className="lp-persona-grid">
          {personaCards.map((card) => (
            <MotionItem key={card.id} className={`lp-persona-card ${card.colorClass}`}>
              <div className="lp-persona-icon" aria-hidden>{card.emoji}</div>
              <h3 className="lp-persona-name">{card.label}</h3>
              <p className="lp-persona-desc">{card.desc}</p>
              <ul className="lp-persona-features" aria-label={`${card.label} features`}>
                {card.features.map((f) => (
                  <li key={f} className="lp-persona-feature">
                    <span className="lp-check" aria-hidden><IconCheck /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </MotionItem>
          ))}
        </MotionStagger>
      </MotionSection>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <MotionSection className="lp-section lp-section--alt" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="lp-section__head">
          <p className="lp-section__label">How it works</p>
          <h2 id="hiw-heading">From quiz idea to results in minutes.</h2>
        </div>

        <MotionStagger className="lp-steps">
          {howItWorksSteps.map((step, i) => (
            <MotionItem key={step.num} className="lp-step">
              <span className="lp-step__num" aria-hidden>{step.num}</span>
              <div className="lp-step__connector" aria-hidden={i === howItWorksSteps.length - 1} />
              <h3 className="lp-step__title">{step.title}</h3>
              <p className="lp-step__desc">{step.desc}</p>
            </MotionItem>
          ))}
        </MotionStagger>
      </MotionSection>

      {/* ── TRUST / WHY QEZ ──────────────────────────── */}
      <MotionSection className="lp-section" id="features" aria-labelledby="why-heading">
        <div className="lp-section__head">
          <p className="lp-section__label">Why Qez</p>
          <h2 id="why-heading">Built for real use — not just demos.</h2>
        </div>

        <MotionStagger className="lp-trust-grid">
          {trustPoints.map((tp) => (
            <MotionItem key={tp.text} className="lp-trust-card">
              <span className="lp-trust-icon" aria-hidden>{tp.icon}</span>
              <p>{tp.text}</p>
            </MotionItem>
          ))}
        </MotionStagger>
      </MotionSection>

      {/* ── CTA BANNER ───────────────────────────────── */}
      <MotionSection className="lp-cta-banner" aria-label="Call to action">
        <div className="lp-cta-banner__inner">
          <div>
            <h2>Ready to run your first quiz?</h2>
            <p className="section-copy">Free forever for small classes. No credit card. Live in minutes.</p>
          </div>
          <div className="hero-actions">
            <Link href="/register" className="primary-link lp-cta-primary">
              Create free account →
            </Link>
            <Link href="/login" className="secondary-link">
              Sign in
            </Link>
          </div>
        </div>
      </MotionSection>

    </MotionPage>
  );
}

/* ─────────────────────────────────────────
   Logged-in home (personalized dashboard shortcuts)
───────────────────────────────────────── */
function LoggedInHome({ session }: { session: AuthSession }) {
  const router = useRouter();
  const [quizCode, setQuizCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setQuizCode(code.toUpperCase().slice(0, 6));
  }, []);

  async function handleQuickJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError(null);
    setIsJoining(true);
    try {
      const data = await apiFetch<JoinQuizResponse>("/api/quizzes/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: quizCode.trim().toUpperCase() }),
      });
      router.push(`/quizzes/${data.quiz.id}/attempt`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Unable to find quiz.");
    } finally {
      setIsJoining(false);
    }
  }

  const dashboardPath = getDefaultDashboardPath(session.user.role);
  const isStudent = session.user.role === "STUDENT";
  const isHost = session.user.role === "WEBINAR_HOST";
  const isAdmin = session.user.role === "ADMIN";
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <MotionPage className="page-shell home-shell">
      <MotionSection className="home-hero">
        {/* Welcome banner */}
        <div className="lp-welcome-banner">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h1 className="lp-welcome-h1">Hey {firstName} 👋</h1>
            <p className="section-copy">Quick access to everything you need.</p>
          </div>
          <span className="lp-role-pill">
            {isStudent ? "🎓 Student" : isHost ? "🎤 Webinar Host" : isAdmin ? "🔐 Admin" : "👩‍🏫 Teacher"}
          </span>
        </div>

        <MotionStagger className="home-grid">
          {isStudent ? (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Quick join</span>
                <h2>Enter quiz code</h2>
                <p>Have a code from your teacher? Paste it below to jump straight in.</p>
                <form className="home-join-form lp-join-form" onSubmit={handleQuickJoin}>
                  <input
                    maxLength={6}
                    onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    required
                    type="text"
                    value={quizCode}
                    className="lp-join-input"
                    aria-label="Quiz join code"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button className="primary-button" disabled={isJoining} type="submit">
                    {isJoining ? "Joining…" : "Join →"}
                  </button>
                </form>
                {joinError ? <p className="status-banner status-banner--error" role="alert">{joinError}</p> : null}
              </MotionItem>

              <MotionItem className="home-card">
                <span className="question-badge">My history</span>
                <h2>Student dashboard</h2>
                <p>See all your quizzes, past scores, and leaderboard positions.</p>
                <Link className="secondary-button" href={dashboardPath}>Go to dashboard →</Link>
              </MotionItem>
            </>
          ) : isHost ? (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Live control</span>
                <h2>Run the stage</h2>
                <p>Open your live event dashboard, start rounds, and reveal the winner podium.</p>
                <Link className="primary-button" href={dashboardPath}>Open live control →</Link>
              </MotionItem>
              <MotionItem className="home-card">
                <span className="question-badge">Studio</span>
                <h2>Create webinar quiz</h2>
                <p>Build the next competition round and keep your live queue ready.</p>
                <Link className="secondary-button" href="/dashboard/host/create">Open studio →</Link>
              </MotionItem>
            </>
          ) : isAdmin ? (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Admin</span>
                <h2>Control center</h2>
                <p>Monitor users, quiz activity, and suspicious attempts from the platform overview.</p>
                <Link className="primary-button" href={dashboardPath}>Open admin →</Link>
              </MotionItem>
              <MotionItem className="home-card">
                <span className="question-badge">Quiz studio</span>
                <h2>Inspect creator flows</h2>
                <p>Jump into the teacher dashboard to review quiz creation end-to-end.</p>
                <Link className="secondary-button" href="/dashboard/teacher">Open quiz studio →</Link>
              </MotionItem>
            </>
          ) : (
            <>
              <MotionItem className="home-card home-card--accent">
                <span className="question-badge">Quiz studio</span>
                <h2>Create or manage quizzes</h2>
                <p>Open your quiz library, edit drafts, and activate live sessions.</p>
                <Link className="primary-button" href={dashboardPath}>Open teacher dashboard →</Link>
              </MotionItem>
              <MotionItem className="home-card">
                <span className="question-badge">Analytics</span>
                <h2>Review performance</h2>
                <p>One place for quiz analytics, leaderboards, and flagged activity.</p>
                <Link className="secondary-button" href={dashboardPath}>View analytics →</Link>
              </MotionItem>
            </>
          )}
        </MotionStagger>
      </MotionSection>
    </MotionPage>
  );
}

/* ─────────────────────────────────────────
   Root export
───────────────────────────────────────── */
export default function HomePage() {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(loadSession());
    return subscribeToSessionChanges(() => setSession(loadSession()));
  }, []);

  // Still loading session
  if (session === undefined) return null;

  if (!session) return <GuestHome />;
  return <LoggedInHome session={session} />;
}
