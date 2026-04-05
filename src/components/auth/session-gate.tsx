"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, loadSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type SessionGateProps = {
  allowedRoles?: AuthSession["user"]["role"][];
  title: string;
  description: string;
  children: (session: AuthSession) => ReactNode;
};

export function SessionGate({
  allowedRoles,
  title,
  description,
  children
}: SessionGateProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <section className="card">
        <span className="eyebrow">Loading</span>
        <h1>{title}</h1>
        <p className="section-copy">Checking your session.</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="card auth-state-card">
        <span className="eyebrow">Sign In Required</span>
        <h1>{title}</h1>
        <p className="section-copy">{description}</p>
        <div className="hero-actions">
          <Link className="primary-link" href="/login">
            Login
          </Link>
          <Link className="secondary-link" href="/register">
            Create account
          </Link>
        </div>
      </section>
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return (
      <section className="card auth-state-card">
        <span className="eyebrow">Access Restricted</span>
        <h1>{title}</h1>
        <p className="section-copy">
          This area is not available for the <strong>{session.user.role}</strong> role.
        </p>
        <div className="hero-actions">
          <button
            className="secondary-link button-reset"
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            type="button"
          >
            Switch account
          </button>
        </div>
      </section>
    );
  }

  return <>{children(session)}</>;
}

