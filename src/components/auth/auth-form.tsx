"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { saveSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
    };
  }
}

type AuthFormProps = {
  mode: "login" | "register";
};

const registerRoles = [
  { value: "STUDENT",      label: "Student",      emoji: "🎓", desc: "I'm joining quizzes" },
  { value: "TEACHER",      label: "Teacher",      emoji: "👩‍🏫", desc: "I'm creating quizzes" },
  { value: "WEBINAR_HOST", label: "Webinar Host", emoji: "🎤", desc: "I'm running live events" },
] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHumanChecked, setIsHumanChecked] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("STUDENT");
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileRenderedRef = useRef(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const oauthError = useMemo(() => {
    const code = searchParams.get("error") ?? searchParams.get("verified");
    switch (code) {
      case "google-not-configured":   return "Google sign-in is not configured for this environment.";
      case "google-state-mismatch":   return "Google sign-in expired or the callback URL did not match. Try again.";
      case "google-token":            return "Google sign-in could not exchange the authorization code.";
      case "google-userinfo":         return "Google sign-in could not load your profile.";
      case "google-email-not-verified": return "Your Google email must be verified before you can sign in.";
      case "google-callback":         return "Google sign-in failed during the callback step.";
      case "success":                 return "Your email has been verified. You can sign in now.";
      case "invalid":                 return "That verification link is invalid or expired.";
      case "missing":                 return "Verification link is missing a token.";
      default:                        return null;
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      !turnstileSiteKey ||
      !isTurnstileReady ||
      !captchaContainerRef.current ||
      !window.turnstile ||
      turnstileRenderedRef.current
    ) return;

    window.turnstile.render(captchaContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(null),
    });
    turnstileRenderedRef.current = true;
  }, [isTurnstileReady, turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (turnstileSiteKey && !captchaToken) {
      setError("Please complete the captcha before continuing.");
      return;
    }
    if (!turnstileSiteKey && !isHumanChecked) {
      setError("Please verify that you are a human before continuing.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "login"
        ? {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            captchaToken: captchaToken ?? undefined,
          }
        : {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            role: selectedRole,
            captchaToken: captchaToken ?? undefined,
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        requiresVerification?: boolean;
      } & AuthSession;

      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");

      if (data.requiresVerification) {
        setMessage(data.message ?? "Account created. Please verify your email before signing in.");
        return;
      }

      saveSession(data);

      const roleRoute =
        data.user.role === "ADMIN"
          ? "/dashboard/admin"
          : data.user.role === "TEACHER"
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

  async function handleResendVerification() {
    const email = searchParams.get("email");
    if (!email) {
      setError("Add ?email=you@example.com to the login URL to resend verification.");
      return;
    }
    setIsResendingVerification(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to resend verification email.");
      setMessage(data.message ?? "Verification email sent.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to resend verification email.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  const isLogin = mode === "login";
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "1"
  );
  const showResendVerification =
    isLogin && Boolean(error?.toLowerCase().includes("verify your email"));

  return (
    <div className="auth-shell">
      {turnstileSiteKey ? (
        <Script
          onLoad={() => setIsTurnstileReady(true)}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      ) : null}

      {/* Left brand panel */}
      <section className="auth-panel auth-panel-brand" aria-label="Qez brand panel">
        <span className="eyebrow">Qez</span>
        <h1>
          {isLogin
            ? "Welcome back to your quiz command center."
            : "Build quizzes. Run live events. See results instantly."}
        </h1>
        <p className="section-copy">
          {isLogin
            ? "Sign in to manage quizzes, track scores, and monitor your event performance."
            : "Create a free account to build timed assessments, run webinar competitions, and analyse results securely."}
        </p>

        <div className="metric-row">
          <div className="metric-card">
            <strong>2 modes</strong>
            <span>Academic &amp; webinar workflows in one system.</span>
          </div>
          <div className="metric-card">
            <strong>Server scoring</strong>
            <span>Results stay trusted — scoring lives on the backend.</span>
          </div>
        </div>

        {!isLogin && (
          <div className="auth-brand-note">
            <span>🔐</span>
            <p>Sign-up is required to take quizzes — this keeps your scores secure and prevents bots from joining.</p>
          </div>
        )}
      </section>

      {/* Right form panel */}
      <section className="auth-panel auth-panel-form" aria-label={isLogin ? "Login form" : "Register form"}>
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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {!isLogin ? (
            <label className="field">
              <span>Full name</span>
              <input name="name" placeholder="Enter your full name" required type="text" autoComplete="name" />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input name="email" placeholder="you@example.com" required type="email" autoComplete="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                placeholder={isLogin ? "Your password" : "At least 8 characters"}
                required
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle button-reset"
                onClick={() => setShowPassword((c) => !c)}
                type="button"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* Visual role selector for registration */}
          {!isLogin ? (
            <div className="field">
              <span>I am a…</span>
              <input type="hidden" name="role" value={selectedRole} />
              <div className="auth-role-grid" role="radiogroup" aria-label="Select your role">
                {registerRoles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === role.value}
                    className={`auth-role-card button-reset ${selectedRole === role.value ? "auth-role-card--active" : ""}`}
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <span className="auth-role-emoji" aria-hidden>{role.emoji}</span>
                    <strong>{role.label}</strong>
                    <span className="auth-role-desc">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* CAPTCHA */}
          {turnstileSiteKey ? (
            <div className="captcha-block">
              <div ref={captchaContainerRef} />
              {!isTurnstileReady ? (
                <span className="inline-note">Loading captcha...</span>
              ) : null}
              <span className="inline-note">Protected by Cloudflare Turnstile.</span>
            </div>
          ) : (
            <label className="human-check">
              <input
                checked={isHumanChecked}
                onChange={(e) => setIsHumanChecked(e.target.checked)}
                type="checkbox"
              />
              <span>Verify that you are a human</span>
            </label>
          )}

          {message ? <p className="form-success" role="status">{message}</p> : null}
          {error || oauthError ? (
            <p className="form-error" role="alert">{error ?? oauthError}</p>
          ) : null}

          <button className="primary-link button-reset wide-button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Please wait…"
              : isLogin
                ? "Sign in →"
                : "Create account →"}
          </button>
        </form>

        {showResendVerification ? (
          <button
            className="secondary-button wide-button"
            disabled={isResendingVerification}
            onClick={() => void handleResendVerification()}
            type="button"
          >
            {isResendingVerification ? "Sending…" : "Resend verification email"}
          </button>
        ) : null}

        <p className="auth-switch">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <Link href={isLogin ? "/register" : "/login"}>
            {isLogin ? "Register" : "Log in"}
          </Link>
        </p>
        {isLogin ? (
          <p className="auth-switch">
            <Link href="/forgot-password">Forgot password?</Link>
          </p>
        ) : null}
        {isLogin ? (
          <p className="auth-switch auth-switch--secondary">
            <Link href="/admin/login">Admin portal login</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
