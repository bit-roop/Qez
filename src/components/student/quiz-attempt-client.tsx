"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonBlock } from "@/components/feedback/skeleton-block";
import { useToast } from "@/components/feedback/toast-provider";
import { apiFetch, getStoredToken } from "@/lib/client-auth";
import { getProfileHoverLabel } from "@/lib/profile";

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
      id: string;
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
    draftAnswers?: Record<string, "A" | "B" | "C" | "D"> | null;
    draftTimeSpent?: Record<string, number> | null;
    lastRecoveredAt?: string | null;
  } | null;
  availabilityMessage?: string | null;
  serverNow: string;
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

type LeaderboardSnapshot = {
  entries: {
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

const WEBINAR_REVEAL_SECONDS = 5;
const ACADEMIC_EXIT_WINDOW_MS = 2800;

function getAttemptStorageKey(quizId: string) {
  return `qez.attempt.cache.${quizId}`;
}

function buildAttemptPayload(
  data: AttemptQuizData,
  selectedAnswers: Record<string, "A" | "B" | "C" | "D">,
  timeSpent: Record<string, number>
) {
  return data.quiz.questions
    .filter((question) => selectedAnswers[question.id])
    .map((question) => ({
      questionId: question.id,
      selectedOptionKey: selectedAnswers[question.id],
      timeTakenSeconds: Math.min(timeSpent[question.id] ?? 0, question.timeLimitSeconds)
    }));
}

function getWebinarPhase(
  questions: AttemptQuizData["quiz"]["questions"],
  startsAt: string,
  nowMs: number
) {
  const startMs = new Date(startsAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

  let cursor = 0;

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionStart = cursor;
    const questionEnd = questionStart + question.timeLimitSeconds;

    if (elapsedSeconds < questionEnd) {
      return {
        phase: "question" as const,
        questionIndex: index,
        secondsRemaining: questionEnd - elapsedSeconds,
        elapsedInQuestion: elapsedSeconds - questionStart
      };
    }

    const revealEnd = questionEnd + WEBINAR_REVEAL_SECONDS;

    if (elapsedSeconds < revealEnd) {
      return {
        phase: "reveal" as const,
        questionIndex: index,
        secondsRemaining: revealEnd - elapsedSeconds,
        elapsedInQuestion: question.timeLimitSeconds
      };
    }

    cursor = revealEnd;
  }

  return {
    phase: "finished" as const,
    questionIndex: Math.max(questions.length - 1, 0),
    secondsRemaining: 0,
    elapsedInQuestion: questions[questions.length - 1]?.timeLimitSeconds ?? 0
  };
}

export function QuizAttemptClient({ quizId }: QuizAttemptClientProps) {
  const { showToast } = useToast();
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
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [webinarBoard, setWebinarBoard] = useState<LeaderboardSnapshot | null>(null);
  const [exitCountdownActive, setExitCountdownActive] = useState(false);
  const [showExitWarningDialog, setShowExitWarningDialog] = useState(false);
  const exitIntentRef = useRef<number | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const lastFocusWarningAtRef = useRef(0);
  const lastDraftSyncRef = useRef(0);

  async function loadAttemptQuiz() {
    try {
      setIsLoading(true);
      const nextData = await apiFetch<AttemptQuizData>(`/api/quizzes/${quizId}/attempt`, {
        method: "GET"
      });
      setData(nextData);
      setServerOffsetMs(new Date(nextData.serverNow).getTime() - Date.now());

      const rawStored = window.localStorage.getItem(getAttemptStorageKey(quizId));
      if (rawStored) {
        try {
          const parsed = JSON.parse(rawStored) as {
            selectedAnswers?: Record<string, "A" | "B" | "C" | "D">;
            timeSpent?: Record<string, number>;
            currentIndex?: number;
          };
          setSelectedAnswers(parsed.selectedAnswers ?? {});
          setTimeSpent(parsed.timeSpent ?? {});
          setCurrentIndex(parsed.currentIndex ?? 0);
        } catch {
          window.localStorage.removeItem(getAttemptStorageKey(quizId));
        }
      }

      if (nextData.attempt?.draftAnswers && typeof nextData.attempt.draftAnswers === "object") {
        setSelectedAnswers(nextData.attempt.draftAnswers as Record<string, "A" | "B" | "C" | "D">);
      }

      if (nextData.attempt?.draftTimeSpent && typeof nextData.attempt.draftTimeSpent === "object") {
        const draftTimeSpent = nextData.attempt.draftTimeSpent as Record<string, number> & {
          __currentQuestionIndex?: number;
        };
        const { __currentQuestionIndex, ...questionTimes } = draftTimeSpent;
        setTimeSpent(questionTimes);
        if (typeof __currentQuestionIndex === "number") {
          setCurrentIndex(__currentQuestionIndex);
        }
      }
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
    const interval = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    window.localStorage.setItem(
      getAttemptStorageKey(quizId),
      JSON.stringify({
        selectedAnswers,
        timeSpent,
        currentIndex
      })
    );
  }, [currentIndex, data, quizId, selectedAnswers, timeSpent]);

  useEffect(() => {
    if (!data || result || !data.quiz.canAttemptNow) {
      return;
    }

    const now = Date.now();

    if (now - lastDraftSyncRef.current < 4000) {
      return;
    }

    lastDraftSyncRef.current = now;

    void apiFetch(`/api/quizzes/${quizId}/attempt`, {
      method: "PATCH",
      body: JSON.stringify({
        selectedAnswers,
        timeSpent,
        currentQuestionIndex: currentIndex
      })
    }).catch(() => undefined);
  }, [currentIndex, data, quizId, result, selectedAnswers, timeSpent]);

  useEffect(() => {
    setWarningCount(data?.attempt?.warningLevel ?? 0);
  }, [data?.attempt?.warningLevel]);

  const questions = data?.quiz.questions ?? [];
  const isWebinar = data?.quiz.mode === "WEBINAR";
  const webinarPhase = useMemo(() => {
    if (!data || !isWebinar) {
      return null;
    }

    return getWebinarPhase(questions, data.quiz.startsAt, clockNowMs + serverOffsetMs);
  }, [clockNowMs, data, isWebinar, questions, serverOffsetMs]);

  const activeQuestionIndex =
    isWebinar && webinarPhase ? Math.max(webinarPhase.questionIndex, 0) : currentIndex;
  const currentQuestion = questions[activeQuestionIndex];
  const currentQuestionElapsed =
    isWebinar && webinarPhase
      ? webinarPhase.elapsedInQuestion
      : currentQuestion
        ? timeSpent[currentQuestion.id] ?? 0
        : 0;
  const currentQuestionRemaining =
    isWebinar && webinarPhase
      ? webinarPhase.secondsRemaining
      : currentQuestion
        ? Math.max(currentQuestion.timeLimitSeconds - currentQuestionElapsed, 0)
        : 0;
  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);
  const webinarWaiting = Boolean(
    isWebinar && data && new Date(data.quiz.startsAt).getTime() > clockNowMs + serverOffsetMs
  );
  const webinarFinished = Boolean(isWebinar && webinarPhase?.phase === "finished");

  useEffect(() => {
    if (!currentQuestion || result || !data?.quiz.canAttemptNow || isWebinar) {
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
  }, [currentQuestion, data?.quiz.canAttemptNow, isWebinar, result]);

  useEffect(() => {
    if (!currentQuestion || result || !data?.quiz.canAttemptNow || isWebinar) {
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
  }, [currentIndex, currentQuestion, currentQuestionRemaining, data?.quiz.canAttemptNow, isSubmitting, isWebinar, questions.length, result]);

  useEffect(() => {
    if (!isWebinar || !data || webinarWaiting || webinarFinished || result) {
      return;
    }

    if (webinarPhase?.phase === "finished" && !isSubmitting) {
      void handleSubmit();
    }
  }, [data, isSubmitting, isWebinar, result, webinarFinished, webinarPhase, webinarWaiting]);

  useEffect(() => {
    if (!data || !isWebinar) {
      return;
    }

    let active = true;

    async function loadWebinarBoard() {
      try {
        const response = await apiFetch<LeaderboardSnapshot>(`/api/quizzes/${quizId}/leaderboard`, {
          method: "GET"
        });

        if (active) {
          setWebinarBoard(response);
        }
      } catch {
        // silent support view
      }
    }

    void loadWebinarBoard();
    const interval = window.setInterval(() => {
      void loadWebinarBoard();
    }, 6000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [data, isWebinar, quizId]);

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
        // keep flow alive even if logging fails
      }
    }

    function throttleSuspiciousEvent(eventType: SuspiciousEventType, message: string) {
      const now = Date.now();

      if (now - lastFocusWarningAtRef.current < 1500) {
        return;
      }

      lastFocusWarningAtRef.current = now;
      void logSuspiciousEvent(eventType, message);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        throttleSuspiciousEvent("TAB_SWITCH", "Tab switch detected. Stay focused on the quiz.");
      }
    }

    function handleWindowBlur() {
      throttleSuspiciousEvent("TAB_SWITCH", "Focus left the quiz window. This activity has been flagged.");
    }

    function handlePageHide() {
      throttleSuspiciousEvent("OTHER", "You left the quiz page. Suspicious activity was logged.");
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
        void logSuspiciousEvent("DEVTOOLS_ATTEMPT", "Developer tools shortcut detected. This activity has been flagged.");
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        void logSuspiciousEvent("FULLSCREEN_EXIT", "Fullscreen exit detected. Please return to the attempt screen.");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [data?.quiz.canAttemptNow, quizId, result]);

  async function submitWithKeepalive() {
    if (!data || isAutoSubmittingRef.current) {
      return;
    }

    isAutoSubmittingRef.current = true;
    const token = getStoredToken();

    try {
      await fetch("/api/attempts/submit", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          quizId: data.quiz.id,
          responses: buildAttemptPayload(data, selectedAnswers, timeSpent)
        })
      });
    } catch {
      // best effort only
    }
  }

  useEffect(() => {
    if (!data || isWebinar || result || !data.quiz.canAttemptNow) {
      return;
    }

    window.history.pushState({ qezAttemptGuard: true }, "", window.location.href);

    function handlePopState() {
      const now = Date.now();
      const withinWindow =
        exitIntentRef.current !== null && now - exitIntentRef.current < ACADEMIC_EXIT_WINDOW_MS;

      if (!withinWindow) {
        exitIntentRef.current = now;
        setExitCountdownActive(true);
        setShowExitWarningDialog(true);
        setWarningMessage("Press back again to exit and submit the quiz.");
        window.history.pushState({ qezAttemptGuard: true }, "", window.location.href);
        window.setTimeout(() => {
          setExitCountdownActive(false);
          setShowExitWarningDialog(false);
        }, ACADEMIC_EXIT_WINDOW_MS);
        return;
      }

      void handleSubmit(true).finally(() => {
        window.location.href = "/dashboard/student";
      });
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
      void submitWithKeepalive();
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [data, isWebinar, result, selectedAnswers, timeSpent]);

  async function handleSubmit(isSilent = false) {
    if (!data) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const submitResult = await apiFetch<SubmitAttemptResponse>("/api/attempts/submit", {
        method: "POST",
        body: JSON.stringify({
          quizId: data.quiz.id,
          responses: buildAttemptPayload(data, selectedAnswers, timeSpent)
        })
      });

      setResult(submitResult);
      window.localStorage.removeItem(getAttemptStorageKey(quizId));
      showToast("Quiz submitted successfully.", "success");
    } catch (caughtError) {
      if (!isSilent) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to submit attempt.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function chooseAnswer(optionKey: "A" | "B" | "C" | "D") {
    if (!currentQuestion) {
      return;
    }

    if (isWebinar && selectedAnswers[currentQuestion.id]) {
      return;
    }

    setSelectedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: optionKey
    }));

    setTimeSpent((current) => ({
      ...current,
      [currentQuestion.id]: Math.min(Math.max(currentQuestionElapsed, 1), currentQuestion.timeLimitSeconds)
    }));
  }

  if (isLoading) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage attempt-stage--minimal">
          <span className="eyebrow">Loading</span>
          <h1>Preparing your quiz room...</h1>
          <div className="dashboard-skeleton-grid" aria-hidden="true">
            <SkeletonBlock className="skeleton--title" />
            <SkeletonBlock className="skeleton--text" />
            <SkeletonBlock className="skeleton--card" />
            <SkeletonBlock className="skeleton--card" />
          </div>
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
        <article className="attempt-stage attempt-stage--result attempt-stage--submitted">
          <span className="eyebrow">Submitted</span>
          <div className="attempt-submit-burst" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h1>Submitted!</h1>
          <p className="section-copy">
            You&apos;ll see results when the quiz closes. Your answers are safely locked in on the server.
          </p>
          <div className="attempt-result-grid attempt-result-grid--compact">
            <article className="metric-card">
              <strong>{result.attempt.responses.length}</strong>
              <span>Questions answered</span>
            </article>
            <article className="metric-card">
              <strong>{result.attempt.totalTimeSeconds}s</strong>
              <span>Time recorded</span>
            </article>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" href="/dashboard/student">
              Back to dashboard
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (isWebinar && webinarWaiting) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage">
          <span className="eyebrow">Waiting Room</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            You&apos;re checked in. Wait for the host to start the synchronized round. Everyone will see the same question and timer together.
          </p>
          <div className="attempt-result-grid">
            <article className="metric-card">
              <strong>{data.quiz.joinCode}</strong>
              <span>Room code</span>
            </article>
            <article className="metric-card">
              <strong>{new Date(data.quiz.startsAt).toLocaleTimeString()}</strong>
              <span>Current scheduled start</span>
            </article>
            <article className="metric-card">
              <strong title={getProfileHoverLabel(data.quiz.owner)}>{data.quiz.owner.name}</strong>
              <span>Host</span>
            </article>
          </div>
        </article>
      </section>
    );
  }

  if (isWebinar && webinarFinished && !result) {
    return (
      <section className="attempt-shell">
        <article className="attempt-stage">
          <span className="eyebrow">Round Complete</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            The live room has ended. We&apos;re wrapping up your webinar attempt now.
          </p>
          <div className="attempt-result-grid">
            <article className="metric-card">
              <strong>{answeredCount}</strong>
              <span>Answers locked</span>
            </article>
            <article className="metric-card">
              <strong>{warningCount}</strong>
              <span>Warnings logged</span>
            </article>
            <article className="metric-card">
              <strong>{data.quiz.questionCount}</strong>
              <span>Total questions</span>
            </article>
          </div>
          <p className="section-copy">
            {isSubmitting
              ? "Submitting your webinar attempt..."
              : "Your answers are no longer changing. You can wait here while the submission finishes."}
          </p>
        </article>
      </section>
    );
  }

  const lockedAnswer = selectedAnswers[currentQuestion.id];
  const showWebinarReveal = Boolean(isWebinar && webinarPhase?.phase === "reveal");

  return (
    <section className={`attempt-shell ${isWebinar ? "attempt-shell--webinar" : "attempt-shell--academic"}`}>
      <article className="attempt-stage attempt-stage--focused">
        {warningMessage ? (
          <div className="attempt-warning-overlay">
            <div className="attempt-warning-card">
              <span className="eyebrow">{exitCountdownActive ? "Exit Warning" : "Focus Warning"}</span>
              <h3>{warningMessage}</h3>
              <p className="section-copy">
                Warning level: {warningCount}. Suspicious activity is logged for review.
              </p>
              {showExitWarningDialog ? (
                <div className="attempt-warning-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setShowExitWarningDialog(false);
                      setExitCountdownActive(false);
                      setWarningMessage(null);
                      exitIntentRef.current = null;
                    }}
                    type="button"
                  >
                    Continue without leaving
                  </button>
                </div>
              ) : null}
              {warningCount >= 3 ? (
                <p className="status-banner status-banner--error">This attempt is now flagged as suspicious.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {showWebinarReveal ? (
          <div className="attempt-webinar-reveal">
            <span className="eyebrow">Round Update</span>
            <h2>Question {currentQuestion.displayOrder} locked</h2>
            <p className="section-copy">
              {lockedAnswer ? `Your answer ${lockedAnswer} is locked.` : "No answer was locked before the timer ended."} Next question begins in {currentQuestionRemaining}s.
            </p>
            <div className="leaderboard-table">
              <div className="leaderboard-row leaderboard-row--head">
                <span>Rank</span>
                <span>Name</span>
                <span>Points</span>
                <span>Score</span>
                <span>Time</span>
              </div>
              {(webinarBoard?.entries ?? []).slice(0, 5).map((entry) => (
                <div className="leaderboard-row" key={entry.id}>
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span title={getProfileHoverLabel({ id: entry.user.id, name: entry.user.name })}>{entry.user.name}</span>
                  <span>{entry.pointsAwarded}</span>
                  <span>{entry.totalScore}</span>
                  <span>{entry.totalTimeSeconds}s</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={`attempt-topbar ${currentQuestionRemaining <= 60 ? "attempt-topbar--urgent" : ""}`}>
              <div className="attempt-topbar__meta">
                <span className={`pill ${isWebinar ? "pill--webinar" : "pill--academic"}`}>{data.quiz.mode}</span>
                <span className="attempt-topbar__count">Q{currentQuestion.displayOrder} of {data.quiz.questionCount}</span>
                <span className="attempt-topbar__answered">{answeredCount} answered</span>
              </div>
              <div className={`attempt-timer-card ${currentQuestionRemaining <= 60 ? "attempt-timer-card--danger" : ""}`}>
                <strong>{currentQuestionRemaining}s</strong>
                <span>{isWebinar ? "Shared timer" : "Time left"}</span>
              </div>
            </div>

            <div className="attempt-progress-panel attempt-progress-panel--full">
              <div className="attempt-progress-top">
                <strong>{Math.round((answeredCount / data.quiz.questionCount) * 100)}%</strong>
                <span>Progress</span>
              </div>
              <div className="attempt-progress-track">
                <div className="attempt-progress-fill" style={{ width: `${(answeredCount / data.quiz.questionCount) * 100}%` }} />
              </div>
            </div>

            <div className="attempt-question-panel">
              <span className="eyebrow">
                {isWebinar ? "Live synchronized question" : "Stay focused on this question"}
              </span>
              <h2>{currentQuestion.prompt}</h2>
              <div className="attempt-question-meta">
                <span className="pill pill-outline">{currentQuestion.difficulty}</span>
                <span className="pill pill-outline">
                  {lockedAnswer ? `Selected: ${lockedAnswer}` : "Choose one answer"}
                </span>
              </div>
            </div>

            {data.availabilityMessage && !isWebinar ? (
              <p className="status-banner status-banner--error">{data.availabilityMessage}</p>
            ) : null}

            <div className="attempt-options-grid attempt-options-grid--stacked">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.optionKey;
                const disabled = isWebinar ? Boolean(lockedAnswer) : false;

                return (
                  <button
                    className={`attempt-option ${isSelected ? "attempt-option--selected" : ""}`}
                    disabled={disabled && !isSelected}
                    key={option.optionKey}
                    onClick={() => chooseAnswer(option.optionKey)}
                    type="button"
                  >
                    <span className="attempt-option-key">{option.optionKey}</span>
                    <span>{option.optionText}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="attempt-stage-footer">
          {!isWebinar ? (
            <button
              className="secondary-button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
              type="button"
            >
              Previous
            </button>
          ) : (
            <div className="question-badge">Synchronized webinar flow</div>
          )}

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
            {!isWebinar ? (
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
            ) : null}
            {!isWebinar ? (
              currentIndex < questions.length - 1 ? (
                <button
                  className="primary-button"
                  onClick={() => setCurrentIndex((current) => Math.min(current + 1, questions.length - 1))}
                  type="button"
                >
                  Next question
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={!data.quiz.canAttemptNow || isSubmitting}
                  onClick={() => void handleSubmit()}
                  type="button"
                >
                  {isSubmitting ? "Submitting..." : "Submit quiz"}
                </button>
              )
            ) : (
              <span className="section-copy">
                {lockedAnswer ? "Answer locked for this question." : "Pick once to lock your answer for the room."}
              </span>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
