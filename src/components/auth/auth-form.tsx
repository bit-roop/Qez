"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type AuthFormProps = {
  mode: "login" | "register";
};

const registerRoles = [
  {
    value: "STUDENT",
    label: "Student"
  },
  {
    value: "TEACHER",
    label: "Teacher"
  },
  {
    value: "WEBINAR_HOST",
    label: "Webinar Host"
  }
] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "login"
        ? {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
          }
        : {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            role: String(formData.get("role") ?? "STUDENT")
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { error?: string } & AuthSession;

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      saveSession(data);

      const roleRoute =
        data.user.role === "TEACHER" || data.user.role === "ADMIN"
          ? "/dashboard/teacher"
          : data.user.role === "WEBINAR_HOST"
            ? "/dashboard/host"
            : "/dashboard/student";

      router.push(roleRoute);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "1"
  );

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel-brand">
        <span className="eyebrow">Qez</span>
        <h1>{isLogin ? "Welcome back to your quiz command center." : "Launch assessments and live competitions from one platform."}</h1>
        <p className="section-copy">
          {isLogin
            ? "Sign in to manage quizzes, track scores, and monitor event performance."
            : "Create an account to build timed assessments, run webinar contests, and analyze results securely."}
        </p>
        <div className="metric-row">
          <div className="metric-card">
            <strong>2 modes</strong>
            <span>Academic and webinar workflows in one system.</span>
          </div>
          <div className="metric-card">
            <strong>Server scoring</strong>
            <span>Results stay trusted because scoring lives on the backend.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <span className="eyebrow">{isLogin ? "Login" : "Register"}</span>
        <h2>{isLogin ? "Sign in" : "Create your account"}</h2>
        {googleEnabled ? (
          <div className="auth-social-block">
            <a className="secondary-button auth-social-button" href="/api/auth/google/start">
              Continue with Google
            </a>
            <span className="inline-note">Google sign-in creates a student account by default.</span>
          </div>
        ) : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin ? (
            <label className="field">
              <span>Full name</span>
              <input name="name" placeholder="Enter your full name" required type="text" />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input name="email" placeholder="you@example.com" required type="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <input name="password" placeholder="At least 8 characters" required type="password" />
          </label>

          {!isLogin ? (
            <label className="field">
              <span>Role</span>
              <select defaultValue="STUDENT" name="role">
                {registerRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-link button-reset wide-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <Link href={isLogin ? "/register" : "/login"}>
            {isLogin ? "Register" : "Login"}
          </Link>
        </p>
        {isLogin ? (
          <p className="auth-switch">
            <Link href="/forgot-password">Forgot password?</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
