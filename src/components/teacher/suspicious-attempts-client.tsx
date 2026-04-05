"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type SuspiciousAttemptsData = {
  quiz: {
    id: string;
    title: string;
  };
  attempts: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
    totalScore: number;
    totalTimeSeconds: number;
    warningLevel: number;
    tabSwitchCount: number;
    suspicious: boolean;
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
  }[];
};

type SuspiciousAttemptsClientProps = {
  quizId: string;
};

export function SuspiciousAttemptsClient({ quizId }: SuspiciousAttemptsClientProps) {
  const [data, setData] = useState<SuspiciousAttemptsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReview() {
      try {
        setIsLoading(true);
        const result = await apiFetch<SuspiciousAttemptsData>(
          `/api/quizzes/${quizId}/suspicious-attempts`,
          { method: "GET" }
        );

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Unable to load suspicious attempts."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadReview();

    return () => {
      active = false;
    };
  }, [quizId]);

  if (isLoading) {
    return (
      <section className="monitor-shell">
        <article className="monitor-panel">
          <span className="eyebrow">Monitoring</span>
          <h1>Loading suspicious-attempt review...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="monitor-shell">
        <article className="monitor-panel">
          <span className="eyebrow">Monitoring</span>
          <h1>We couldn&apos;t load the review panel.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="monitor-shell">
      <article className="monitor-panel monitor-panel--hero">
        <div>
          <span className="eyebrow">Suspicious Review</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            Review flagged behavior, warning levels, and event history per participant.
          </p>
        </div>
        <article className="metric-card">
          <strong>{data.attempts.length}</strong>
          <span>Tracked attempts</span>
        </article>
      </article>

      <div className="monitor-list">
        {data.attempts.length === 0 ? (
          <article className="monitor-panel">
            <p className="section-copy">No suspicious attempts have been recorded for this quiz yet.</p>
          </article>
        ) : (
          data.attempts.map((attempt) => (
            <article className="monitor-panel" key={attempt.id}>
              <div className="monitor-top">
                <div>
                  <span className={`pill ${attempt.suspicious ? "pill-warning-critical" : "pill-warning"}`}>
                    {attempt.suspicious ? "Flagged Suspicious" : "Warning Logged"}
                  </span>
                  <h2>{attempt.user.name}</h2>
                  <p className="section-copy">{attempt.user.email}</p>
                </div>
                <div className="monitor-stats">
                  <span>Warnings: {attempt.warningLevel}</span>
                  <span>Tab switches: {attempt.tabSwitchCount}</span>
                  <span>Status: {attempt.status}</span>
                </div>
              </div>

              <div className="monitor-event-list">
                {attempt.suspiciousEvents.map((eventItem) => (
                  <div className="monitor-event" key={eventItem.id}>
                    <strong>{eventItem.eventType.replaceAll("_", " ")}</strong>
                    <span>{new Date(eventItem.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="hero-actions">
                <Link className="secondary-button" href={`/quizzes/${quizId}/attempts/${attempt.id}`}>
                  Review full attempt
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
