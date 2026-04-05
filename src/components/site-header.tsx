"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SessionStatus } from "@/components/auth/session-status";
import { loadSession, subscribeToSessionChanges } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

export function SiteHeader() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(loadSession());

    return subscribeToSessionChanges(() => {
      setSession(loadSession());
    });
  }, []);

  const navItems = useMemo(() => {
    if (!session) {
      return [
        { href: "/", label: "Home" },
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register" }
      ];
    }

    if (session.user.role === "ADMIN") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/admin", label: "Admin" },
        { href: "/dashboard/teacher", label: "Quizzes" }
      ];
    }

    if (session.user.role === "WEBINAR_HOST") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/host", label: "Live Control" },
        { href: "/dashboard/teacher", label: "Quiz Studio" }
      ];
    }

    if (session.user.role === "TEACHER") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/teacher", label: "Quiz Studio" },
        { href: "/dashboard/host", label: "Live Control" }
      ];
    }

    return [
      { href: "/", label: "Home" },
      { href: "/dashboard/student", label: "Student" },
      { href: "/settings", label: "Profile" }
    ];
  }, [session]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href="/">
          <BrandMark className="brand-lockup__mark" />
          <span>
            <strong>Qez</strong>
            <small>Quizzes &amp; Tests Made Easy</small>
          </span>
        </Link>

        <div className="site-header__actions">
          <nav className="site-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <SessionStatus />
        </div>
      </div>
    </header>
  );
}
