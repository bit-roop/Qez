"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
import { getStoredToken } from "@/lib/client-auth";
import { getProfileHoverLabel, getProfileSerial } from "@/lib/profile";

type LeaderboardData = {
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
    allowLeaderboard: boolean;
    leaderboardVisibility: "HIDDEN" | "TOP_10" | "FULL";
  };
  entries: {
    id: string;
    rank: number;
    pointsAwarded: number;
    totalScore: number;
    totalTimeSeconds: number;
    suspicious: boolean;
    submittedAt?: string | null;
    user: {
      id: string;
      name: string;
    };
  }[];
  topPerformers: {
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
  myEntry?: {
    rank: number;
    totalScore: number;
    totalTimeSeconds: number;
    suspicious: boolean;
    user: {
      id: string;
      name: string;
    };
  } | null;
  totalParticipants: number;
  lastUpdatedAt: string;
};

type LeaderboardClientProps = {
  quizId: string;
};

export function LeaderboardClient({ quizId }: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        const result = await apiFetch<LeaderboardData>(`/api/quizzes/${quizId}/leaderboard`, {
          method: "GET"
        });

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load leaderboard.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboard();

    const token = getStoredToken();

    if (token) {
      const eventSource = new EventSource(
        `/api/quizzes/${quizId}/leaderboard/stream?token=${encodeURIComponent(token)}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (!active) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as LeaderboardData;
          setData(payload);
          setError(null);
          setIsLoading(false);
          setIsLive(true);
        } catch {
          setIsLive(false);
        }
      };

      eventSource.onerror = () => {
        setIsLive(false);
      };
    }

    return () => {
      active = false;
      eventSourceRef.current?.close();
    };
  }, [quizId]);

  if (isLoading) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Leaderboard</span>
          <h1>Loading live standings...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="leaderboard-shell">
        <article className="leaderboard-panel">
          <span className="eyebrow">Leaderboard</span>
          <h1>We couldn&apos;t open this leaderboard.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
          <Link className="secondary-button" href="/dashboard/student">
            Back
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="leaderboard-shell">
      <article className="leaderboard-panel leaderboard-panel--hero">
        <div>
          <span className="eyebrow">Live Standings</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            {data.quiz.mode === "WEBINAR"
              ? "Fastest correct answers rise to the top. Rankings refresh on a steadier live cadence."
              : "Academic rankings are sorted by score first and time second."}
          </p>
        </div>

        <div className="leaderboard-hero-metrics">
          <article className="metric-card">
            <strong>{data.totalParticipants}</strong>
            <span>Total participants</span>
          </article>
          <article className="metric-card">
            <strong>{data.quiz.leaderboardVisibility}</strong>
            <span>Visibility mode</span>
          </article>
          <article className="metric-card">
            <strong>{isLive ? "LIVE" : "SYNC"}</strong>
            <span>{isLive ? "Streaming updates" : "Snapshot mode"}</span>
          </article>
        </div>
      </article>

      {data.quiz.mode === "WEBINAR" && data.topPerformers.length > 0 ? (
        <article className="leaderboard-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Podium</span>
              <h2>Fastest top performers right now</h2>
            </div>
            <span className="question-badge">
              {isLive ? "Live stream" : "Refreshed"} {new Date(data.lastUpdatedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="webinar-podium webinar-podium--revealed">
            {data.topPerformers.map((entry, index) => (
              <article
                className={`webinar-podium-card webinar-podium-card--${index + 1}`}
                key={entry.id}
              >
                <span className="webinar-podium-rank">#{entry.rank}</span>
                <strong title={getProfileHoverLabel({ id: entry.user.id, name: entry.user.name })}>
                  {entry.user.name}
                </strong>
                <small>{`QEZ-${getProfileSerial(entry.user.id)}`}</small>
                <span>{entry.pointsAwarded} pts</span>
                <span>{entry.totalScore} score</span>
                <span>{entry.totalTimeSeconds}s</span>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      {data.myEntry ? (
        <article className="leaderboard-panel leaderboard-panel--me">
          <span className="eyebrow">Your Position</span>
          <div className="leaderboard-me-grid">
            <article className="metric-card">
              <strong>#{data.myEntry.rank}</strong>
              <span>Rank</span>
            </article>
            <article className="metric-card">
              <strong>{data.myEntry.totalScore}</strong>
              <span>Score</span>
            </article>
            <article className="metric-card">
              <strong>{data.myEntry.totalTimeSeconds}s</strong>
              <span>Total time</span>
            </article>
          </div>
        </article>
      ) : null}

      <article className="leaderboard-panel">
        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-row--head">
            <span>Rank</span>
            <span>Name</span>
            <span>Points</span>
            <span>Score</span>
            <span>Time</span>
          </div>

          {data.entries.map((entry) => (
            <div className="leaderboard-row" key={entry.id}>
              <span className="leaderboard-rank">#{entry.rank}</span>
              <span className="leaderboard-person" title={getProfileHoverLabel({ id: entry.user.id, name: entry.user.name })}>
                <strong>{entry.user.name}</strong>
                <small>{`QEZ-${getProfileSerial(entry.user.id)}`}</small>
              </span>
              <span>{entry.pointsAwarded}</span>
              <span>{entry.totalScore}</span>
              <span>{entry.totalTimeSeconds}s</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
