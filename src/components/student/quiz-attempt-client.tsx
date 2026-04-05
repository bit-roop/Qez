"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type AttemptQuizData = {
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
    canAttemptNow: boolean;
    owner: {
      name: string;
      role: "TEACHER" | "ADMIN" | "WEBINAR_HOST";
    };
    questions: {
      id: string;
      prompt: string;
      explanation?: string | null;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      displayOrder: number;
      timeLimitSeconds: number;
      options: {
        optionKey: "A" | "B" | "C" | "D";
        optionText: string;
      }[];
    }[];
  };
  attempt?: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
    totalScore: number;
    totalTimeSeconds: number;
    warningLevel: number;
    suspicious: boolean;
    submittedAt?: string | null;
  } | null;
  availabilityMessage?: string | null;
};

type SubmitAttemptResponse = {
  attempt: {
    id: string;
    status: "SUBMITTED";
    totalScore: number;
    totalTimeSeconds: number;
    submittedAt: string;
    responses: {
      questionId: string;
      selectedOptionKey: string;
      isCorrect: boolean;
      timeTakenSeconds: number;
    }[];
  };
  leaderboardEligible: boolean;
  negativeMarkingConfigured: boolean;
};

type QuizAttemptClientProps = {
  quizId: string;
};

type SuspiciousEventType =
  | "TAB_SWITCH"
  | "RIGHT_CLICK"
  | "DEVTOOLS_ATTEMPT"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "OTHER";

export function QuizAttemptClient({ quizId }: QuizAttemptClientProps) {
  const [data, setData] = useState<AttemptQuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);

  async function loadAttemptQuiz() {
    try {
      setIsLoading(true);
      const nextData = await apiFetch<AttemptQuizData>(`/api/quizzes/${quizId}/attempt`, {
        method: "GET"
      });
      setData(nextData);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load quiz.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAttemptQuiz();
  }, [quizId]);

  useEffect(() => {
    setWarningCount(data?.attempt?.warningLevel ?? 0);
  }, [data?.attempt?.warningLevel]);

  const questions = data?.quiz.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const currentQuestionElapsed = currentQuestion ? timeSpent[currentQuestion.id] ?? 0 : 0;
  const currentQuestionRemaining = currentQuestion
    ? Math.max(currentQuestion.timeLimitSeconds - currentQuestionElapsed, 0)
    : 0;
  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  useEffect(() => {
    if (!currentQuestion || result || !data?.quiz.canAttemptNow) {
      return;
    }

    const questionId = currentQuestion.id;
    const interval = window.setInterval(() => {
      setTimeSpent((current) => ({
        ...current,
        [questionId]: Math.min((current[questionId] ?? 0) + 1, currentQuestion.timeLimitSeconds)
      }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentQuestion, data?.quiz.canAttemptNow, result]);

  useEffect(() => {
    if (!currentQuestion || result || !data?.quiz.canAttemptNow) {
      return;
    }

    if (currentQuestionRemaining > 0) {
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => Math.min(current + 1, questions.length - 1));
      return;
    }

    if (!isSubmitting) {
      void handleSubmit();
    }
  }, [
    currentIndex,
    currentQuestion,
    currentQuestionRemaining,
    data?.quiz.canAttemptNow,
    isSubmitting,
    questions.length,
    result
  ]);

  useEffect(() => {
    if (!data?.quiz.canAttemptNow || result) {
      return;
    }

    let active = true;

    async function logSuspiciousEvent(eventType: SuspiciousEventType, message: string) {
      if (!active) {
        return;
      }

      setWarningCount((current) => current + 1);
      setWarningMessage(message);

      window.setTimeout(() => {
        if (active) {
          setWarningMessage((current) => (current === message ? null : current));
        }
      }, 2400);

      try {
        const response = await apiFetch<{
          attempt: {
            warningLevel: number;
            suspicious: boolean;
          };
        }>("/api/suspicious-events", {
          method: "POST",
          body: JSON.stringify({
            quizId,
            eventType,
            metadata: {
              at: new Date().toISOString()
            }
          })
        });

        setWarningCount(response.attempt.warningLevel);
        setData((current) =>
          current
            ? {
                ...current,
                attempt: current.attempt
                  ? {
                      ...current.attempt,
                      warningLevel: response.attempt.warningLevel,
                      suspicious: response.attempt.suspicious
                    }
                  : {
                      id: "",
                      status: "IN_PROGRESS",
                      totalScore: 0,
                      totalTimeSeconds: 0,
                      warningLevel: response.attempt.warningLevel,
                      suspicious: response.attempt.suspicious
                    }
              }
            : current
        );
      } catch {
        // Keep the attempt flow alive even if logging fails.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void logSuspiciousEvent("TAB_SWITCH", "Tab switch detected. Stay focused on the quiz.");
      }
    }

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
      void logSuspiciousEvent("RIGHT_CLICK", "Right click is disabled during this attempt.");
    }

    function handleCopy(event: ClipboardEvent) {
      event.preventDefault();
      void logSuspiciousEvent("COPY_ATTEMPT", "Copy action detected and blocked.");
    }

    function handleKeyDown(event: KeyboardEvent) {
      const devtoolsShortcut =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase()));

      if (devtoolsShortcut) {
        event.preventDefault();
        void logSuspiciousEvent(
          "DEVTOOLS_ATTEMPT",
          "Developer tools shortcut detected. This activity has been flagged."
        );
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        void logSuspiciousEvent(
          "FULLSCREEN_EXIT",
          "Fullscreen exit detected. Please return to the attempt screen."
        );
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [data?.quiz.canAttemptNow, quizId, result]);

  async function handleSubmit() {
    if (!data) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const responses = data.quiz.questions
        .filter((question) => selectedAnswers[question.id])
        .map((question) => ({
          questionId: question.id,
          selectedOptionKey: selectedAnswers[question.id],
          timeTakenSeconds: Math.min(
            timeSpent[question.id] ?? 0,
            question.timeLimitSeconds
          )
        }));

      const submitResult = await apiFetch<SubmitAttemptResponse>("/api/attempts/submit", {
        method: "POST",
        body: JSON.stringify({
          quizId: data.quiz.id,
          responses
        })
      });

      setResult(submitResult);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit attempt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage">
          <span className="eyebrow">Loading</span>
          <h1>Preparing your quiz arena...</h1>
          <p className="section-copy">Fetching questions, timings, and attempt status.</p>
        </article>
      </section>
    );
  }

  if (error) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage">
          <span className="eyebrow">Error</span>
          <h1>We couldn&apos;t load this quiz.</h1>
          <p className="status-banner status-banner--error">{error}</p>
          <Link className="secondary-button" href="/dashboard/student">
            Back to student dashboard
          </Link>
        </article>
      </section>
    );
  }

  if (!data || !currentQuestion) {
    return null;
  }

  if (result) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage attempt-stage--result">
          <span className="eyebrow">Submitted</span>
          <h1>You completed {data.quiz.title}.</h1>
          <div className="attempt-result-grid">
            <article className="metric-card">
              <strong>{result.attempt.totalScore}</strong>
              <span>Your score</span>
            </article>
            <article className="metric-card">
              <strong>{result.attempt.totalTimeSeconds}s</strong>
              <span>Total response time</span>
            </article>
            <article className="metric-card">
              <strong>{result.attempt.responses.length}</strong>
              <span>Answered questions</span>
            </article>
          </div>
          <p className="section-copy">
            {result.leaderboardEligible
              ? "This attempt is eligible for webinar ranking logic."
              : "Your academic attempt has been securely scored on the server."}
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href={`/quizzes/${quizId}/result`}>
              Review result
            </Link>
            <Link className="secondary-button" href="/dashboard/student">
              Back to dashboard
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="attempt-shell">
      <aside className="attempt-sidebar">
        <span className="eyebrow">Qez Arena</span>
        <h1>{data.quiz.title}</h1>
        <p className="section-copy">
          {data.quiz.mode === "WEBINAR"
            ? "Fast, correct answers matter most here. Move quickly, but don’t guess blindly."
            : "Focus on accuracy and pace. Your submission will be scored on the server after you finish."}
        </p>

        <div className="attempt-sidebar-meta">
          <span className={`pill ${data.quiz.mode === "WEBINAR" ? "pill--webinar" : "pill--academic"}`}>
            {data.quiz.mode}
          </span>
          <span className="pill pill-outline">{data.quiz.questionCount} questions</span>
          <span className={`pill ${warningCount >= 3 ? "pill-warning-critical" : "pill-warning"}`}>
            Warnings: {warningCount}
          </span>
        </div>

        <div className="attempt-progress-panel">
          <div className="attempt-progress-top">
            <strong>{answeredCount}/{data.quiz.questionCount}</strong>
            <span>Questions answered</span>
          </div>
          <div className="attempt-progress-track">
            <div
              className="attempt-progress-fill"
              style={{
                width: `${(answeredCount / data.quiz.questionCount) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="attempt-sidebar-note">
          <strong>Auto-flow is on</strong>
          <span>
            When a question timer reaches zero, Qez moves to the next question automatically and
            submits the final screen for you.
          </span>
        </div>

        <div className="attempt-index-grid">
          {questions.map((question, index) => (
            <button
              className={`attempt-index-pill ${index === currentIndex ? "attempt-index-pill--active" : ""} ${selectedAnswers[question.id] ? "attempt-index-pill--done" : ""}`}
              key={question.id}
              onClick={() => setCurrentIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
      </aside>

      <article className="attempt-stage">
        {warningMessage ? (
          <div className="attempt-warning-overlay">
            <div className="attempt-warning-card">
              <span className="eyebrow">Focus Warning</span>
              <h3>{warningMessage}</h3>
              <p className="section-copy">
                Warning level: {warningCount}. Suspicious activity is logged for teacher review.
              </p>
              {warningCount >= 3 ? (
                <p className="status-banner status-banner--error">
                  This attempt is now flagged as suspicious.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="attempt-stage-top">
          <div>
            <span className="eyebrow">Question {currentQuestion.displayOrder}</span>
            <h2>{currentQuestion.prompt}</h2>
            <div className="attempt-question-meta">
              <span className="pill pill-outline">{currentQuestion.difficulty}</span>
              <span className="pill pill-outline">
                {selectedAnswers[currentQuestion.id]
                  ? `Selected: ${selectedAnswers[currentQuestion.id]}`
                  : "No answer selected"}
              </span>
            </div>
          </div>
          <div className="attempt-timer-card">
            <strong>{currentQuestionRemaining}s</strong>
            <span>Question timer</span>
          </div>
        </div>

        {data.availabilityMessage ? (
          <p className="status-banner status-banner--error">{data.availabilityMessage}</p>
        ) : null}

        <div className="attempt-options-grid">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.optionKey;

            return (
              <button
                className={`attempt-option ${isSelected ? "attempt-option--selected" : ""}`}
                key={option.optionKey}
                onClick={() =>
                  setSelectedAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: option.optionKey
                  }))
                }
                type="button"
              >
                <span className="attempt-option-key">{option.optionKey}</span>
                <span>{option.optionText}</span>
              </button>
            );
          })}
        </div>

        <div className="attempt-stage-footer">
          <button
            className="secondary-button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
            type="button"
          >
            Previous
          </button>

          <div className="attempt-stage-actions">
            <button
              className="secondary-button"
              onClick={() => {
                void document.documentElement.requestFullscreen?.();
              }}
              type="button"
            >
              Focus mode
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                setSelectedAnswers((current) => {
                  const nextAnswers = { ...current };
                  delete nextAnswers[currentQuestion.id];
                  return nextAnswers;
                })
              }
              type="button"
            >
              Clear choice
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                className="primary-button"
                onClick={() =>
                  setCurrentIndex((current) => Math.min(current + 1, questions.length - 1))
                }
                type="button"
              >
                Next question
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={!data.quiz.canAttemptNow || isSubmitting}
                onClick={handleSubmit}
                type="button"
              >
                {isSubmitting ? "Submitting..." : "Submit quiz"}
              </button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
