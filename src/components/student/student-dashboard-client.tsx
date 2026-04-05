"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch, clearSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type JoinQuizResponse = {
  quiz: {
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
    questionCount: number;
    owner: {
      name: string;
      role: "TEACHER" | "ADMIN" | "WEBINAR_HOST";
    };
  };
};

type StudentDashboardClientProps = {
  session: AuthSession;
};

const roadmapItems = [
  "Join a live or academic quiz using a code",
  "See timer and question flow in a focused attempt layout",
  "View leaderboard only when the quiz allows it",
  "Review post-quiz results and flagged warnings"
];

export function StudentDashboardClient({ session }: StudentDashboardClientProps) {
  const [activePanel, setActivePanel] = useState<"join" | "experience">(() => {
    if (typeof window === "undefined") {
      return "join";
    }

    const saved = window.sessionStorage.getItem("qez.student.dashboard.tab");
    return saved === "experience" ? "experience" : "join";
  });
  const [quizCode, setQuizCode] = useState("");
  const [matchedQuiz, setMatchedQuiz] = useState<JoinQuizResponse["quiz"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem("qez.student.dashboard.tab", activePanel);
  }, [activePanel]);

  async function handleJoinLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMatchedQuiz(null);
    setIsSearching(true);

    try {
      const data = await apiFetch<JoinQuizResponse>("/api/quizzes/join", {
        method: "POST",
        body: JSON.stringify({
          joinCode: quizCode.trim().toUpperCase()
        })
      });

      setMatchedQuiz(data.quiz);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to find quiz.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Student Workspace</span>
          <h1>Join quickly, answer fast, and keep the attempt flow distraction-free.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. This dashboard is built to make
            timed quizzes feel focused while keeping results and leaderboard access under quiz
            rules.
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

      <section className="dashboard-panel">
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activePanel === "join" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("join")}
            type="button"
          >
            Join Quiz
          </button>
          <button
            className={`dashboard-tab ${activePanel === "experience" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("experience")}
            type="button"
          >
            Student Experience
          </button>
        </div>

        {activePanel === "join" ? (
          <article className="dashboard-card dashboard-card--full">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Join Quiz</span>
                <h2>Enter your code</h2>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleJoinLookup}>
              <label className="field">
                <span>Quiz code</span>
                <input
                  maxLength={6}
                  name="joinCode"
                  onChange={(event) => setQuizCode(event.target.value.toUpperCase())}
                  placeholder="Example: 9F1A2C"
                  required
                  type="text"
                  value={quizCode}
                />
              </label>

              {error ? <p className="status-banner status-banner--error">{error}</p> : null}

              <button className="primary-button" disabled={isSearching} type="submit">
                {isSearching ? "Looking up quiz..." : "Find quiz"}
              </button>
            </form>

            {matchedQuiz ? (
              <article className="quiz-summary-card quiz-summary-card--hero">
                <div className="quiz-summary-card__top">
                  <div>
                    <span className={`pill ${matchedQuiz.mode === "WEBINAR" ? "pill--webinar" : "pill--academic"}`}>
                      {matchedQuiz.mode}
                    </span>
                    <h3>{matchedQuiz.title}</h3>
                  </div>
                  <span className={`pill pill-${matchedQuiz.state.toLowerCase()}`}>{matchedQuiz.state}</span>
                </div>

                <p className="section-copy">
                  {matchedQuiz.description || "No description provided for this quiz."}
                </p>

                <div className="quiz-summary-card__meta">
                  <span>{matchedQuiz.questionCount} questions</span>
                  <span>Host: {matchedQuiz.owner.name}</span>
                  <span>Leaderboard: {matchedQuiz.leaderboardVisibility}</span>
                </div>

                <p className="section-copy">
                  Starts: {new Date(matchedQuiz.startsAt).toLocaleString()} | Ends:{" "}
                  {new Date(matchedQuiz.endsAt).toLocaleString()}
                </p>

                <div className="hero-actions">
                  <Link className="primary-button" href={`/quizzes/${matchedQuiz.id}/attempt`}>
                    Open attempt screen
                  </Link>
                  {matchedQuiz.allowLeaderboard ? (
                    <Link
                      className="secondary-button"
                      href={`/quizzes/${matchedQuiz.id}/leaderboard`}
                    >
                      View leaderboard
                    </Link>
                  ) : null}
                </div>
              </article>
            ) : null}
          </article>
        ) : (
          <article className="dashboard-card dashboard-card--full">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Student Experience</span>
                <h2>What this dashboard is built for</h2>
              </div>
            </div>

            <div className="experience-grid">
              {roadmapItems.map((item, index) => (
                <article className="preview-card preview-card--feature" key={item}>
                  <span className="question-badge">0{index + 1}</span>
                  <p className="section-copy">{item}</p>
                </article>
              ))}
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
