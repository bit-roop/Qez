"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, downloadAuthenticatedFile } from "@/lib/client-auth";

type QuizResultData = {
  quiz: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
  };
  attempt: {
    id: string;
    totalScore: number;
    totalTimeSeconds: number;
    warningLevel: number;
    suspicious: boolean;
    submittedAt?: string | null;
  };
  certificateClaim?: {
    id: string;
    title: string;
    claimedAt: string;
  } | null;
  questions: {
    id: string;
    prompt: string;
    explanation?: string | null;
    displayOrder: number;
    correctOptionKey: string;
    options: {
      optionKey: "A" | "B" | "C" | "D";
      optionText: string;
    }[];
    response?: {
      selectedOptionKey: string;
      isCorrect: boolean;
      timeTakenSeconds: number;
    } | null;
  }[];
};

type QuizResultClientProps = {
  quizId: string;
};

export function QuizResultClient({ quizId }: QuizResultClientProps) {
  const [data, setData] = useState<QuizResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadResult() {
      try {
        setIsLoading(true);
        const result = await apiFetch<QuizResultData>(`/api/quizzes/${quizId}/result`, {
          method: "GET"
        });

        if (active) {
          setData(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load result.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      active = false;
    };
  }, [quizId]);

  if (isLoading) {
    return (
      <section className="result-shell">
        <article className="result-panel">
          <span className="eyebrow">Result</span>
          <h1>Loading your result review...</h1>
        </article>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="result-shell">
        <article className="result-panel">
          <span className="eyebrow">Result</span>
          <h1>We couldn&apos;t load your quiz review.</h1>
          <p className="status-banner status-banner--error">{error ?? "Unknown error."}</p>
        </article>
      </section>
    );
  }

  async function handleClaimCertificate() {
    try {
      setIsClaiming(true);
      setClaimMessage(null);

      await apiFetch(`/api/quizzes/${quizId}/certificate/claim`, {
        method: "POST"
      });

      setData((current) =>
        current
          ? {
              ...current,
              certificateClaim: {
                id: "claimed",
                title: `${current.quiz.title} Completion Certificate`,
                claimedAt: new Date().toISOString()
              }
            }
          : current
      );
      setClaimMessage("Certificate claimed. It now appears in your achievements tab.");
    } catch (caughtError) {
      setClaimMessage(caughtError instanceof Error ? caughtError.message : "Unable to claim certificate.");
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleDownloadCertificate() {
    if (!data) {
      setClaimMessage("Result details are not available yet.");
      return;
    }

    try {
      setIsDownloadingCertificate(true);
      setClaimMessage(null);
      await downloadAuthenticatedFile(
        `/api/quizzes/${quizId}/certificate/pdf`,
        `${data.quiz.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`
      );
    } catch (caughtError) {
      setClaimMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to download certificate."
      );
    } finally {
      setIsDownloadingCertificate(false);
    }
  }

  return (
    <section className="result-shell">
      <article className="result-panel result-panel--hero">
        <div>
          <span className="eyebrow">Attempt Review</span>
          <h1>{data.quiz.title}</h1>
          <p className="section-copy">
            Review your answers, correct options, and explanations question by question.
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
        <div className="hero-actions">
          {data.certificateClaim ? (
            <button
              className="secondary-button"
              disabled={isDownloadingCertificate}
              onClick={() => void handleDownloadCertificate()}
              type="button"
            >
              {isDownloadingCertificate ? "Downloading..." : "Download certificate"}
            </button>
          ) : (
            <button className="secondary-button" disabled={isClaiming} onClick={() => void handleClaimCertificate()} type="button">
              {isClaiming ? "Claiming..." : "Claim certificate"}
            </button>
          )}
        </div>
        {claimMessage ? <p className="form-success">{claimMessage}</p> : null}

        <div className="result-question-list">
          {data.questions.map((question) => (
            <article className="result-question-card" key={question.id}>
              <div className="result-question-top">
                <span className="question-badge">Q{question.displayOrder}</span>
                <span
                  className={`pill ${
                    question.response?.isCorrect ? "pill-active" : "pill-warning-critical"
                  }`}
                >
                  {question.response?.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <h3>{question.prompt}</h3>
              <div className="result-options">
                {question.options.map((option) => {
                  const isSelected = question.response?.selectedOptionKey === option.optionKey;
                  const isCorrect = question.correctOptionKey === option.optionKey;

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
              {question.explanation ? (
                <p className="section-copy">Explanation: {question.explanation}</p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="hero-actions">
          <Link className="secondary-button" href="/dashboard/student">
            Back to dashboard
          </Link>
          <Link className="primary-button" href={`/quizzes/${quizId}/leaderboard`}>
            Open leaderboard
          </Link>
        </div>
      </article>
    </section>
  );
}
