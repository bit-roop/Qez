"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type WinnerCertificateData = {
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
  };
  winners: {
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

type WinnerCertificateClientProps = {
  quizId: string;
};

export function WinnerCertificateClient({ quizId }: WinnerCertificateClientProps) {
  const [data, setData] = useState<WinnerCertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCertificates() {
      try {
        const leaderboard = await apiFetch<{
          quiz: WinnerCertificateData["quiz"];
          topPerformers: WinnerCertificateData["winners"];
        }>(`/api/quizzes/${quizId}/leaderboard`, {
          method: "GET"
        });

        if (!active) {
          return;
        }

        setData({
          quiz: leaderboard.quiz,
          winners: leaderboard.topPerformers
        });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to load winner certificates.");
      }
    }

    void loadCertificates();

    return () => {
      active = false;
    };
  }, [quizId]);

  if (error) {
    return (
      <section className="analytics-shell">
        <article className="analytics-panel">
          <span className="eyebrow">Winner Export</span>
          <h1>We couldn&apos;t prepare the winner certificates.</h1>
          <p className="status-banner status-banner--error">{error}</p>
        </article>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="analytics-shell">
        <article className="analytics-panel">
          <span className="eyebrow">Winner Export</span>
          <h1>Preparing winner certificates...</h1>
        </article>
      </section>
    );
  }

  return (
    <section className="analytics-shell certificate-shell">
      <article className="analytics-panel analytics-panel--hero">
        <div>
          <span className="eyebrow">Winner Certificates</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            Printable recognition cards for the current webinar podium.
          </p>
        </div>
        <div className="quiz-actions">
          <a
            className="primary-button"
            href={`/api/quizzes/${quizId}/winners/export`}
          >
            Export winners CSV
          </a>
          <button
            className="secondary-button"
            onClick={() => window.print()}
            type="button"
          >
            Print certificates
          </button>
        </div>
      </article>

      <section className="certificate-grid">
        {data.winners.map((winner) => (
          <article className="certificate-card" key={winner.id}>
            <span className="eyebrow">Qez Webinar Recognition</span>
            <h2>{winner.user.name}</h2>
            <p className="section-copy">
              Awarded <strong>Rank #{winner.rank}</strong> in <strong>{data.quiz.title}</strong>.
            </p>
            <div className="certificate-metrics">
              <span>{winner.pointsAwarded} prize points</span>
              <span>{winner.totalScore} score</span>
              <span>{winner.totalTimeSeconds}s total time</span>
            </div>
          </article>
        ))}

        {data.winners.length === 0 ? (
          <article className="analytics-panel">
            <span className="eyebrow">Winner Export</span>
            <h2>No winners yet</h2>
            <p className="section-copy">
              Once submissions arrive, the top podium entries will appear here.
            </p>
          </article>
        ) : null}
      </section>
    </section>
  );
}
