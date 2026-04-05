"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type AttemptReviewData = {
  quiz: {
    id: string;
    title: string;
  };
  attempt: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
    totalScore: number;
    totalTimeSeconds: number;
    warningLevel: number;
    tabSwitchCount: number;
    suspicious: boolean;
    startedAt: string;
    submittedAt?: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
    suspiciousEvents: {
      id: string;
      eventType: string;
      createdAt: string;
    }[];
    responses: {
      questionId: string;
      selectedOptionKey: string;
      isCorrect: boolean;
      timeTakenSeconds: number;
      question: {
        prompt: string;
        displayOrder: number;
        explanation?: string | null;
        correctOptionKey: string;
        options: {
          optionKey: string;
          optionText: string;
        }[];
      };
    }[];
  };
};

type AttemptReviewClientProps = {
  quizId: string;
  attemptId: string;
};

export function AttemptReviewClient({ quizId, attemptId }: AttemptReviewClientProps) {
  const [data, setData] = useState<AttemptReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAttemptReview() {
      try {
        setIsLoading(true);
        const result = await apiFetch<AttemptReviewData>(
          `/api/quizzes/${quizId}/attempts/${attemptId}`,
          { method: "GET" }
        );

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Unable to load attempt review."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAttemptReview();

    return () => {
      active = false;
    };
  }, [attemptId, quizId]);

  if (isLoading) {
    return (
      <section className="result-shell">
        <article className="result-panel">
          <span className="eyebrow">Attempt Review</span>
          <h1>Loading attempt details...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="result-shell">
        <article className="result-panel">
          <span className="eyebrow">Attempt Review</span>
          <h1>We couldn&apos;t load this attempt.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="result-shell">
      <article className="result-panel result-panel--hero">
        <div>
          <span className="eyebrow">Participant Attempt</span>
          <h1>{data.attempt.user.name}</h1>
          <p className="section-copy">
            {data.attempt.user.email} on {data.quiz.title}
          </p>
        </div>
        <div className="result-metric-grid">
          <article className="metric-card">
            <strong>{data.attempt.totalScore}</strong>
            <span>Score</span>
          </article>
          <article className="metric-card">
            <strong>{data.attempt.totalTimeSeconds}s</strong>
            <span>Total time</span>
          </article>
          <article className="metric-card">
            <strong>{data.attempt.warningLevel}</strong>
            <span>Warnings</span>
          </article>
        </div>
      </article>

      <article className="result-panel">
        <div className="quiz-summary-card__meta">
          <span className={`pill ${data.attempt.suspicious ? "pill-warning-critical" : "pill-warning"}`}>
            {data.attempt.suspicious ? "Suspicious" : "Under review"}
          </span>
          <span className="question-badge">Tab switches: {data.attempt.tabSwitchCount}</span>
          <span className="question-badge">Status: {data.attempt.status}</span>
        </div>

        <div className="result-question-list">
          {data.attempt.responses.map((response) => (
            <article className="result-question-card" key={response.questionId}>
              <div className="result-question-top">
                <span className="question-badge">Q{response.question.displayOrder}</span>
                <span className={`pill ${response.isCorrect ? "pill-active" : "pill-warning-critical"}`}>
                  {response.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <h3>{response.question.prompt}</h3>
              <p className="section-copy">Time taken: {response.timeTakenSeconds}s</p>
              <div className="result-options">
                {response.question.options.map((option) => {
                  const isSelected = response.selectedOptionKey === option.optionKey;
                  const isCorrect = response.question.correctOptionKey === option.optionKey;

                  return (
                    <div
                      className={`result-option ${
                        isCorrect
                          ? "result-option--correct"
                          : isSelected
                            ? "result-option--selected"
                            : ""
                      }`}
                      key={option.optionKey}
                    >
                      <span className="attempt-option-key">{option.optionKey}</span>
                      <span>{option.optionText}</span>
                    </div>
                  );
                })}
              </div>
              {response.question.explanation ? (
                <p className="section-copy">Explanation: {response.question.explanation}</p>
              ) : null}
            </article>
          ))}
        </div>

        {data.attempt.suspiciousEvents.length > 0 ? (
          <div className="monitor-event-list">
            {data.attempt.suspiciousEvents.map((eventItem) => (
              <div className="monitor-event" key={eventItem.id}>
                <strong>{eventItem.eventType.replaceAll("_", " ")}</strong>
                <span>{new Date(eventItem.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="hero-actions">
          <Link className="secondary-button" href={`/quizzes/${quizId}/monitor`}>
            Back to flag review
          </Link>
        </div>
      </article>
    </section>
  );
}
