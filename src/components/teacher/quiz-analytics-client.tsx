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

  const difficultyBreakdown = ["EASY", "MEDIUM", "HARD"].map((difficulty) => {
    const questions = data.questions.filter((question) => question.difficulty === difficulty);
    const averageAccuracy =
      questions.length > 0
        ? Number(
            (
              questions.reduce((sum, question) => sum + question.accuracyPercent, 0) / questions.length
            ).toFixed(1)
          )
        : 0;

    return {
      difficulty,
      count: questions.length,
      averageAccuracy
    };
  });

  const paceSegments = data.questions.map((question) => ({
    id: question.id,
    label: `Q${question.displayOrder}`,
    avgTimeSeconds: question.avgTimeSeconds,
    accuracyPercent: question.accuracyPercent
  }));

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

      <section className="analytics-ring-grid">
        <article className="analytics-ring-card">
          <div
            className="analytics-ring"
            style={{ ["--ring-value" as string]: `${Math.min((data.quiz.avgScore / Math.max(data.quiz.totalQuestions, 1)) * 100, 100)}%` }}
          >
            <div>
              <strong>{data.quiz.avgScore}</strong>
              <span>avg score</span>
            </div>
          </div>
          <h3>Score Efficiency</h3>
          <p className="section-copy">Average score compared to total quiz size.</p>
        </article>

        <article className="analytics-ring-card">
          <div
            className="analytics-ring analytics-ring--warning"
            style={{ ["--ring-value" as string]: `${data.quiz.submittedAttempts > 0 ? (data.quiz.suspiciousAttempts / data.quiz.submittedAttempts) * 100 : 0}%` }}
          >
            <div>
              <strong>{data.quiz.suspiciousAttempts}</strong>
              <span>flagged</span>
            </div>
          </div>
          <h3>Integrity Watch</h3>
          <p className="section-copy">Share of submitted attempts that were flagged.</p>
        </article>

        <article className="analytics-ring-card">
          <div
            className="analytics-ring analytics-ring--time"
            style={{ ["--ring-value" as string]: `${Math.min((data.quiz.avgTimeSeconds / Math.max(data.questions.reduce((sum, question) => sum + question.avgTimeSeconds, 0), 1)) * 100, 100)}%` }}
          >
            <div>
              <strong>{data.quiz.avgTimeSeconds}s</strong>
              <span>avg time</span>
            </div>
          </div>
          <h3>Pacing Load</h3>
          <p className="section-copy">How heavy the average completion time feels overall.</p>
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

      <section className="analytics-grid analytics-grid--charts">
        <article className="analytics-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Difficulty View</span>
              <h2>Accuracy by difficulty</h2>
            </div>
          </div>
          <div className="analytics-mini-chart">
            {difficultyBreakdown.map((item) => (
              <article className="analytics-mini-chart-card" key={item.difficulty}>
                <div className="analytics-question-top">
                  <span className="pill pill-outline">{item.difficulty}</span>
                  <span>{item.count} questions</span>
                </div>
                <strong>{item.averageAccuracy}%</strong>
                <span>average accuracy</span>
                <div className="analytics-bar">
                  <div className="analytics-bar-fill" style={{ width: `${item.averageAccuracy}%` }} />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="analytics-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Pace View</span>
              <h2>Question timing map</h2>
            </div>
          </div>
          <div className="analytics-timeline">
            {paceSegments.map((segment) => (
              <div className="analytics-timeline-row" key={segment.id}>
                <span>{segment.label}</span>
                <div className="analytics-timeline-track">
                  <div
                    className="analytics-timeline-fill"
                    style={{ width: `${Math.min(segment.avgTimeSeconds / 60, 1) * 100}%` }}
                  />
                </div>
                <strong>{segment.avgTimeSeconds}s</strong>
              </div>
            ))}
          </div>
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
