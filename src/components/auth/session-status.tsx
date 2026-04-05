"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSession,
  getDefaultDashboardPath,
  loadSession,
  subscribeToSessionChanges
} from "@/lib/client-auth";
import { getAvatarPreset, getInitials } from "@/lib/profile";
import { AuthSession } from "@/types/client-auth";

export function SessionStatus() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(loadSession());

    return subscribeToSessionChanges(() => {
      setSession(loadSession());
    });
  }, []);

  if (!session) {
    return (
      <div className="session-status">
        <Link className="secondary-link" href="/login">
          Login
        </Link>
        <Link className="primary-link" href="/register">
          Register
        </Link>
      </div>
    );
  }

  const avatar = getAvatarPreset(session.user.avatarKey);

  return (
    <div className="session-status">
      <Link className="session-chip session-chip--profile" href="/settings">
        <span className="session-avatar" style={{ background: avatar.accent }}>
          {getInitials(session.user.name)}
        </span>
        <span>{session.user.name}</span>
        <strong>{session.user.role.replaceAll("_", " ")}</strong>
      </Link>
      <button
        className="secondary-link button-reset"
        onClick={() => {
          clearSession();
          window.location.href = "/";
        }}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
