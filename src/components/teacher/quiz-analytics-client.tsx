"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type QuizAnalyticsData = {
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
    totalQuestions: number;
    totalAttempts: number;
    submittedAttempts: number;
    avgScore: number;
    avgTimeSeconds: number;
    suspiciousAttempts: number;
    bestAttempt?: {
      name: string;
      score: number;
      time: number;
    } | null;
    hardestQuestion?: {
      id: string;
      prompt: string;
      displayOrder: number;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      attemptsCount: number;
      correctCount: number;
      accuracyPercent: number;
      avgTimeSeconds: number;
    } | null;
  };
  questions: {
    id: string;
    prompt: string;
    displayOrder: number;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    attemptsCount: number;
    correctCount: number;
    accuracyPercent: number;
    avgTimeSeconds: number;
  }[];
};

type QuizAnalyticsClientProps = {
  quizId: string;
};

export function QuizAnalyticsClient({ quizId }: QuizAnalyticsClientProps) {
  const [data, setData] = useState<QuizAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const result = await apiFetch<QuizAnalyticsData>(`/api/analytics/quizzes/${quizId}`, {
          method: "GET"
        });

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load analytics.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [quizId]);

  if (isLoading) {
    return (
      <section className="analytics-shell">
        <article className="analytics-panel">
          <span className="eyebrow">Analytics</span>
          <h1>Loading quiz insights...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="analytics-shell">
        <article className="analytics-panel">
          <span className="eyebrow">Analytics</span>
          <h1>We couldn&apos;t load this quiz report.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="analytics-shell">
      <article className="analytics-panel analytics-panel--hero">
        <div>
          <span className="eyebrow">Teacher Analytics</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            Review performance, pacing, and suspicious activity patterns for this quiz.
          </p>
        </div>
        <div className="analytics-highlight">
          <span className={`pill ${data.quiz.mode === "WEBINAR" ? "pill--webinar" : "pill--academic"}`}>
            {data.quiz.mode}
          </span>
        </div>
      </article>

      <section className="analytics-metric-grid">
        <article className="metric-card">
          <strong>{data.quiz.submittedAttempts}</strong>
          <span>Submitted attempts</span>
        </article>
        <article className="metric-card">
          <strong>{data.quiz.avgScore}</strong>
          <span>Average score</span>
        </article>
        <article className="metric-card">
          <strong>{data.quiz.avgTimeSeconds}s</strong>
          <span>Average completion time</span>
        </article>
        <article className="metric-card">
          <strong>{data.quiz.suspiciousAttempts}</strong>
          <span>Suspicious attempts</span>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Top Outcome</span>
              <h2>Best performer</h2>
            </div>
          </div>
          {data.quiz.bestAttempt ? (
            <div className="analytics-callout">
              <strong>{data.quiz.bestAttempt.name}</strong>
              <p className="section-copy">
                Score {data.quiz.bestAttempt.score} with total time{" "}
                {data.quiz.bestAttempt.time}s.
              </p>
            </div>
          ) : (
            <p className="section-copy">No submitted attempts yet.</p>
          )}
        </article>

        <article className="analytics-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Hardest Question</span>
              <h2>Lowest accuracy</h2>
            </div>
          </div>
          {data.quiz.hardestQuestion ? (
            <div className="analytics-callout">
              <strong>Q{data.quiz.hardestQuestion.displayOrder}</strong>
              <p className="section-copy">{data.quiz.hardestQuestion.prompt}</p>
              <p className="section-copy">
                Accuracy {data.quiz.hardestQuestion.accuracyPercent}% and avg time{" "}
                {data.quiz.hardestQuestion.avgTimeSeconds}s.
              </p>
            </div>
          ) : (
            <p className="section-copy">Question analytics will appear after attempts are submitted.</p>
          )}
        </article>
      </section>

      <article className="analytics-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Question Breakdown</span>
            <h2>Performance by question</h2>
          </div>
        </div>

        <div className="analytics-question-list">
          {data.questions.map((question) => (
            <article className="analytics-question-card" key={question.id}>
              <div className="analytics-question-top">
                <span className="question-badge">Q{question.displayOrder}</span>
                <span className="pill pill-outline">{question.difficulty}</span>
              </div>
              <h3>{question.prompt}</h3>
              <div className="analytics-question-stats">
                <span>{question.accuracyPercent}% accuracy</span>
                <span>{question.avgTimeSeconds}s avg time</span>
                <span>{question.attemptsCount} attempts</span>
              </div>
              <div className="analytics-bar">
                <div
                  className="analytics-bar-fill"
                  style={{ width: `${question.accuracyPercent}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

