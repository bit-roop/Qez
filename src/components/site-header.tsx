"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SessionStatus } from "@/components/auth/session-status";
import { loadSession, subscribeToSessionChanges } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

export function SiteHeader() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setSession(loadSession());

    return subscribeToSessionChanges(() => {
      setSession(loadSession());
    });
  }, []);

  const navItems = useMemo(() => {
    if (!session) {
      return [{ href: "/", label: "Home" }];
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
        { href: "/settings", label: "Profile" }
      ];
    }

    if (session.user.role === "TEACHER") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/teacher", label: "Quiz Studio" },
        { href: "/settings", label: "Profile" }
      ];
    }

    return [
      { href: "/", label: "Home" },
      { href: "/dashboard/student", label: "Student" },
      { href: "/settings", label: "Profile" }
    ];
  }, [session]);

  const headerContent = (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href="/">
          <span className="brand-lockup__mark brand-lockup__mark--image">
            <Image
              alt="Qez logo"
              className="brand-lockup__logo-image"
              height={56}
              priority
              src="/qez-logo.png"
              width={56}
            />
          </span>
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

  if (prefersReducedMotion) {
    return headerContent;
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {headerContent}
    </motion.div>
  );
}
