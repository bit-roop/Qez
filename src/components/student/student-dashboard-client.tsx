"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SkeletonBlock } from "@/components/feedback/skeleton-block";
import { useToast } from "@/components/feedback/toast-provider";
import { apiFetch, clearSession, downloadAuthenticatedFile } from "@/lib/client-auth";
import { MotionPage } from "@/components/motion/motion-shell";
import { getProfileHoverLabel, getProfileSerial } from "@/lib/profile";
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
      id?: string;
      name: string;
      role: "TEACHER" | "ADMIN" | "WEBINAR_HOST";
      institution?: string | null;
    };
  };
};

type StudentDashboardClientProps = {
  session: AuthSession;
};

type Achievement = {
  id: string;
  title: string;
  claimedAt: string;
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
  };
  attempt?: {
    totalScore: number;
    totalTimeSeconds: number;
    submittedAt?: string | null;
  } | null;
};

type HistoryItem = {
  id: string;
  status: "SUBMITTED" | "AUTO_SUBMITTED";
  totalScore: number;
  totalTimeSeconds: number;
  warningLevel: number;
  suspicious: boolean;
  submittedAt: string;
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
    showResultsToStudents: boolean;
  };
};

export function StudentDashboardClient({ session }: StudentDashboardClientProps) {
  const { showToast } = useToast();
  const [activePanel, setActivePanel] = useState<"join" | "history" | "achievements">(() => {
    if (typeof window === "undefined") {
      return "join";
    }

    const saved = window.sessionStorage.getItem("qez.student.dashboard.tab");
    return saved === "history" || saved === "achievements" ? saved : "join";
  });
  const [quizCode, setQuizCode] = useState("");
  const [matchedQuiz, setMatchedQuiz] = useState<JoinQuizResponse["quiz"] | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [downloadingQuizId, setDownloadingQuizId] = useState<string | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem("qez.student.dashboard.tab", activePanel);
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "history") {
      return;
    }

    let active = true;

    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const data = await apiFetch<{ history: HistoryItem[] }>("/api/student/history", {
          method: "GET"
        });

        if (active) {
          setHistory(data.history);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load quiz history.");
        }
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "achievements") {
      return;
    }

    let active = true;

    async function loadAchievements() {
      try {
        setIsLoadingAchievements(true);
        const data = await apiFetch<{ achievements: Achievement[] }>("/api/student/achievements", {
          method: "GET"
        });

        if (active) {
          setAchievements(data.achievements);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load achievements.");
        }
      } finally {
        if (active) {
          setIsLoadingAchievements(false);
        }
      }
    }

    void loadAchievements();

    return () => {
      active = false;
    };
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
      showToast(`Quiz ${data.quiz.title} found.`, "success");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to find quiz.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <MotionPage className="dashboard-page">
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

      <section className="stats-grid">
        <article className="metric-card">
          <strong>{`QEZ-${session.user.profileSerial ?? getProfileSerial(session.user.id)}`}</strong>
          <span>Your profile serial</span>
        </article>
        <article className="metric-card">
          <strong>{session.user.institution || "Add profile"}</strong>
          <span>Institution</span>
        </article>
        <article className="metric-card">
          <strong>Synced</strong>
          <span>Webinar rounds stay time-aligned</span>
        </article>
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
            className={`dashboard-tab ${activePanel === "history" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("history")}
            type="button"
          >
            History
          </button>
          <button
            className={`dashboard-tab ${activePanel === "achievements" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("achievements")}
            type="button"
          >
            Achievements
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
                  <span
                    title={getProfileHoverLabel({
                      id: matchedQuiz.owner.id ?? matchedQuiz.id,
                      institution: matchedQuiz.owner.institution,
                      name: matchedQuiz.owner.name,
                      role: matchedQuiz.owner.role
                    })}
                  >
                    Host: {matchedQuiz.owner.name}
                  </span>
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
        ) : activePanel === "history" ? (
          <article className="dashboard-card dashboard-card--full">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Quiz History</span>
                <h2>Your participated quizzes</h2>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="dashboard-skeleton-grid" aria-hidden="true">
                <SkeletonBlock className="skeleton--card" />
                <SkeletonBlock className="skeleton--card" />
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__art" aria-hidden="true">📚</div>
                <h3>No quiz history yet</h3>
                <p className="section-copy">Your submitted quizzes will show up here once you complete your first attempt.</p>
                <button className="primary-button" onClick={() => setActivePanel("join")} type="button">
                  Join a quiz now
                </button>
              </div>
            ) : (
              <div className="experience-grid">
                {history.map((item) => (
                  <article className="preview-card preview-card--feature" key={item.id}>
                    <span className={`pill ${item.quiz.mode === "WEBINAR" ? "pill--webinar" : "pill--academic"}`}>
                      {item.quiz.mode}
                    </span>
                    <h3>{item.quiz.title}</h3>
                    <p className="section-copy">
                      Submitted on {new Date(item.submittedAt).toLocaleString()}.
                    </p>
                    <p className="section-copy">
                      Score {item.totalScore} • Time {item.totalTimeSeconds}s • Warnings {item.warningLevel}
                    </p>
                    <p className="section-copy">
                      {item.suspicious ? "Flagged for review." : "No suspicious flag on record."}
                    </p>
                    <div className="hero-actions">
                      {item.quiz.showResultsToStudents ? (
                        <Link className="primary-button" href={`/quizzes/${item.quiz.id}/result`}>
                          Open result
                        </Link>
                      ) : (
                        <span className="section-copy">Result is still hidden by the host.</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        ) : (
          <article className="dashboard-card dashboard-card--full">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Achievements</span>
                <h2>Claimed certificates</h2>
              </div>
              <span className="question-badge">{achievements.length} earned</span>
            </div>

            {isLoadingAchievements ? (
              <div className="dashboard-skeleton-grid" aria-hidden="true">
                <SkeletonBlock className="skeleton--card" />
                <SkeletonBlock className="skeleton--card" />
              </div>
            ) : achievements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__art" aria-hidden="true">🏅</div>
                <h3>No certificates yet</h3>
                <p className="section-copy">Claim a certificate from a completed result page and it will appear here for quick download.</p>
                <button className="primary-button" onClick={() => setActivePanel("history")} type="button">
                  Check recent results
                </button>
              </div>
            ) : (
              <div className="experience-grid">
                {achievements.map((achievement) => (
                  <article className="preview-card preview-card--feature" key={achievement.id}>
                    <span className={`pill ${achievement.quiz.mode === "WEBINAR" ? "pill--webinar" : "pill--academic"}`}>
                      {achievement.quiz.mode}
                    </span>
                    <h3>{achievement.title}</h3>
                    <p className="section-copy">
                      Claimed on {new Date(achievement.claimedAt).toLocaleDateString()}.
                    </p>
                    <p className="section-copy">
                      Score {achievement.attempt?.totalScore ?? 0} • Time {achievement.attempt?.totalTimeSeconds ?? 0}s
                    </p>
                    <div className="hero-actions">
                      <button
                        className="secondary-button"
                        disabled={downloadingQuizId === achievement.quiz.id}
                        onClick={() => {
                          setDownloadingQuizId(achievement.quiz.id);
                          void downloadAuthenticatedFile(
                            `/api/quizzes/${achievement.quiz.id}/certificate/pdf`,
                            `${achievement.quiz.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`
                          )
                            .then(() => showToast("Certificate downloaded.", "success"))
                            .finally(() => setDownloadingQuizId((current) => (current === achievement.quiz.id ? null : current)));
                        }}
                        type="button"
                      >
                        {downloadingQuizId === achievement.quiz.id ? "Downloading..." : "Download PDF"}
                      </button>
                      <Link className="primary-button" href={`/quizzes/${achievement.quiz.id}/result`}>
                        Open result
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        )}
      </section>
    </MotionPage>
  );
}
