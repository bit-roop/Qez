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
          <div className="certificate-metrics">
            <span>{data.winners.length} winners shown</span>
            <span>{data.winners[0]?.user.name ?? "No podium yet"}</span>
          </div>
        </div>
        <div className="quiz-actions">
          <a
            className="primary-button"
            href={`/api/quizzes/${quizId}/winners/export`}
          >
            Export winners CSV
          </a>
        </div>
      </article>

      <section className="hero-strip">
        <div>
          <strong>{data.winners.length}</strong>
          <span>Podium entries</span>
        </div>
        <div>
          <strong>{data.winners[0]?.user.name ?? "TBD"}</strong>
          <span>Current first place</span>
        </div>
        <div>
          <strong>{data.winners[0]?.pointsAwarded ?? 0}</strong>
          <span>Top prize points</span>
        </div>
      </section>

      <section className="certificate-grid">
        {data.winners.map((winner) => (
          <article className="certificate-card" key={winner.id}>
            <div className="certificate-card__top">
              <div>
                <span className="eyebrow">Qez Webinar Recognition</span>
                <h2>{winner.user.name}</h2>
              </div>
              <span className="question-badge">Rank #{winner.rank}</span>
            </div>
            <p className="section-copy">
              Awarded for the live results in <strong>{data.quiz.title}</strong>.
            </p>
            <div className="certificate-metrics certificate-metrics--dense">
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
