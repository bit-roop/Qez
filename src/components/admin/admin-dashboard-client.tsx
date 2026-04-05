"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "WEBINAR_HOST";
  createdAt: string;
  _count: {
    attempts: number;
    createdQuizzes: number;
  };
};

type AdminOverviewResponse = {
  stats: {
    usersCount: number;
    quizzesCount: number;
    attemptsCount: number;
    suspiciousAttemptsCount: number;
  };
  roleCounts: {
    role: "STUDENT" | "TEACHER" | "ADMIN" | "WEBINAR_HOST";
    _count: {
      role: number;
    };
  }[];
  quizModeCounts: {
    mode: "ACADEMIC" | "WEBINAR";
    _count: {
      mode: number;
    };
  }[];
  recentUsers: AdminUser[];
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
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "quizzes">("overview");

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [overviewResponse, usersResponse] = await Promise.all([
          apiFetch<AdminOverviewResponse>("/api/admin/overview", {
            method: "GET"
          }),
          apiFetch<{ users: AdminUser[] }>("/api/admin/users", {
            method: "GET"
          })
        ]);

        setOverview(overviewResponse);
        setUsers(usersResponse.users);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin overview.");
      }
    }

    void loadAdminData();
  }, []);

  async function updateRole(userId: string, role: AdminUser["role"]) {
    try {
      setError(null);
      setMessage(null);

      const response = await apiFetch<{ user: AdminUser }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({
          userId,
          role
        })
      });

      setUsers((current) =>
        current.map((user) => (user.id === userId ? response.user : user))
      );
      setMessage("User role updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update role.");
    }
  }

  const roleCounts = useMemo(
    () => new Map(overview?.roleCounts.map((entry) => [entry.role, entry._count.role]) ?? []),
    [overview]
  );
  const quizModeCounts = useMemo(
    () => new Map(overview?.quizModeCounts.map((entry) => [entry.mode, entry._count.mode]) ?? []),
    [overview]
  );

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero dashboard-hero--admin">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Admin Command</span>
          <h1>System-wide visibility for Qez.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. Monitor users, quizzes, attempts,
            and suspicious activity from one place.
          </p>
        </div>

        <div className="admin-hero-card">
          <span className="question-badge">Control</span>
          <strong>Platform overview</strong>
          <span>Use this dashboard for governance, user roles, and oversight.</span>
        </div>
      </section>

      <div className="dashboard-tabbar">
        <button
          className={activeTab === "overview" ? "primary-button" : "secondary-button"}
          onClick={() => setActiveTab("overview")}
          type="button"
        >
          Overview
        </button>
        <button
          className={activeTab === "users" ? "primary-button" : "secondary-button"}
          onClick={() => setActiveTab("users")}
          type="button"
        >
          User management
        </button>
        <button
          className={activeTab === "quizzes" ? "primary-button" : "secondary-button"}
          onClick={() => setActiveTab("quizzes")}
          type="button"
        >
          Quiz access
        </button>
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {overview && activeTab === "overview" ? (
        <>
          <section className="stats-grid">
            <article className="metric-card">
              <strong>{overview.stats.usersCount}</strong>
              <span>Total users</span>
            </article>
            <article className="metric-card">
              <strong>{overview.stats.quizzesCount}</strong>
              <span>Total quizzes</span>
            </article>
            <article className="metric-card">
              <strong>{overview.stats.attemptsCount}</strong>
              <span>Total attempts</span>
            </article>
            <article className="metric-card">
              <strong>{overview.stats.suspiciousAttemptsCount}</strong>
              <span>Suspicious attempts</span>
            </article>
          </section>

          <section className="stats-grid">
            <article className="metric-card">
              <strong>{roleCounts.get("STUDENT") ?? 0}</strong>
              <span>Students</span>
            </article>
            <article className="metric-card">
              <strong>{roleCounts.get("TEACHER") ?? 0}</strong>
              <span>Teachers</span>
            </article>
            <article className="metric-card">
              <strong>{roleCounts.get("WEBINAR_HOST") ?? 0}</strong>
              <span>Hosts</span>
            </article>
            <article className="metric-card">
              <strong>{quizModeCounts.get("WEBINAR") ?? 0}</strong>
              <span>Webinar quizzes</span>
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
                {overview.recentUsers.map((user) => (
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
                <span className="question-badge">
                  {overview.stats.suspiciousAttemptsCount} suspicious attempts
                </span>
              </div>

              <div className="admin-list">
                {overview.recentQuizzes.map((quiz) => (
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

      {activeTab === "users" ? (
        <section className="dashboard-grid">
          <article className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">User Management</span>
                <h2>Role controls</h2>
              </div>
              <span className="question-badge">{users.length} accounts</span>
            </div>

            <div className="admin-user-table">
              <div className="admin-user-table__row admin-user-table__row--head">
                <span>Account</span>
                <span>Email</span>
                <span>Activity</span>
                <span>Role</span>
              </div>
              {users.map((user) => (
                <div className="admin-user-table__row" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span>{user.email}</span>
                  <span>
                    {user._count.attempts} attempts • {user._count.createdQuizzes} quizzes
                  </span>
                  <label className="admin-role-picker">
                    <span className="sr-only">Role</span>
                    <select
                      onChange={(event) =>
                        updateRole(user.id, event.target.value as AdminUser["role"])
                      }
                      value={user.role}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="WEBINAR_HOST">Webinar host</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {overview && activeTab === "quizzes" ? (
        <section className="dashboard-grid">
          <article className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Quiz Access</span>
                <h2>Recent quiz control</h2>
              </div>
            </div>

            <div className="admin-list">
              {overview.recentQuizzes.map((quiz) => (
                <article className="admin-list-item" key={quiz.id}>
                  <div>
                    <strong>{quiz.title}</strong>
                    <p>
                      {quiz.mode} • {quiz.owner.name} • {quiz._count.questions} questions • {quiz._count.attempts} attempts
                    </p>
                  </div>
                  <div className="admin-list-meta admin-list-meta--actions">
                    <span className={`pill pill-${quiz.state.toLowerCase()}`}>{quiz.state}</span>
                    <Link className="secondary-button" href={`/quizzes/${quiz.id}`}>
                      Open
                    </Link>
                    <Link className="secondary-button" href={`/quizzes/${quiz.id}/analytics`}>
                      Analytics
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
