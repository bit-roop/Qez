"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type AdminOverviewResponse = {
  stats: {
    usersCount: number;
    quizzesCount: number;
    attemptsCount: number;
    suspiciousAttemptsCount: number;
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | "WEBINAR_HOST";
    createdAt: string;
  }[];
  recentQuizzes: {
    id: string;
    title: string;
    mode: "ACADEMIC" | "WEBINAR";
    state: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
    createdAt: string;
    owner: {
      id: string;
      name: string;
      role: "TEACHER" | "ADMIN" | "WEBINAR_HOST";
    };
    _count: {
      attempts: number;
      questions: number;
    };
  }[];
};

type AdminDashboardClientProps = {
  session: AuthSession;
};

export function AdminDashboardClient({ session }: AdminDashboardClientProps) {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await apiFetch<AdminOverviewResponse>("/api/admin/overview", {
          method: "GET"
        });
        setData(response);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin overview.");
      }
    }

    void loadOverview();
  }, []);

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero dashboard-hero--admin">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Admin Command</span>
          <h1>System-wide visibility for Qez.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. Monitor users, quizzes, attempts, and suspicious activity from one place.
          </p>
        </div>

        <div className="admin-hero-card">
          <span className="question-badge">Control</span>
          <strong>Platform overview</strong>
          <span>Use this dashboard for monitoring, not everyday quiz creation.</span>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {data ? (
        <>
          <section className="stats-grid">
            <article className="metric-card">
              <strong>{data.stats.usersCount}</strong>
              <span>Total users</span>
            </article>
            <article className="metric-card">
              <strong>{data.stats.quizzesCount}</strong>
              <span>Total quizzes</span>
            </article>
            <article className="metric-card">
              <strong>{data.stats.attemptsCount}</strong>
              <span>Total attempts</span>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Recent Users</span>
                  <h2>New accounts</h2>
                </div>
              </div>

              <div className="admin-list">
                {data.recentUsers.map((user) => (
                  <article className="admin-list-item" key={user.id}>
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.email}</p>
                    </div>
                    <div className="admin-list-meta">
                      <span className="pill pill-outline">{user.role}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Recent Quizzes</span>
                  <h2>Latest activity</h2>
                </div>
                <span className="question-badge">{data.stats.suspiciousAttemptsCount} suspicious attempts</span>
              </div>

              <div className="admin-list">
                {data.recentQuizzes.map((quiz) => (
                  <article className="admin-list-item" key={quiz.id}>
                    <div>
                      <strong>{quiz.title}</strong>
                      <p>
                        {quiz.owner.name} • {quiz._count.questions} questions • {quiz._count.attempts} attempts
                      </p>
                    </div>
                    <div className="admin-list-meta">
                      <span className={`pill pill-${quiz.state.toLowerCase()}`}>{quiz.state}</span>
                      <Link className="secondary-button" href={`/quizzes/${quiz.id}`}>
                        Open
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
