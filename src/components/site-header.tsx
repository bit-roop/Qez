"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SessionStatus } from "@/components/auth/session-status";
import { loadSession, subscribeToSessionChanges } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

export function SiteHeader() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setSession(loadSession());
    return subscribeToSessionChanges(() => {
      setSession(loadSession());
    });
  }, []);

  // Close menu on route change (simple approach)
  useEffect(() => {
    setMenuOpen(false);
  }, [session]);

  const navItems = useMemo(() => {
    if (!session) {
      return [
        { href: "/#features", label: "Features" },
        { href: "/#how-it-works", label: "How it works" },
        { href: "/#who-its-for", label: "For you" },
      ];
    }
    if (session.user.role === "ADMIN") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/admin", label: "Admin panel" },
        { href: "/dashboard/teacher", label: "Quizzes" },
      ];
    }
    if (session.user.role === "WEBINAR_HOST") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/host", label: "Live control" },
        { href: "/dashboard/host/create", label: "Create quiz" },
        { href: "/settings", label: "Profile" },
      ];
    }
    if (session.user.role === "TEACHER") {
      return [
        { href: "/", label: "Home" },
        { href: "/dashboard/teacher", label: "Quiz studio" },
        { href: "/settings", label: "Profile" },
      ];
    }
    return [
      { href: "/", label: "Home" },
      { href: "/dashboard/student", label: "My quizzes" },
      { href: "/settings", label: "Profile" },
    ];
  }, [session]);

  const headerContent = (
    <header className="site-header">
      <div className="site-header__inner">
        {/* Brand */}
        <Link className="brand-lockup" href="/" aria-label="Qez home">
          <span className="brand-lockup__mark brand-lockup__mark--image">
            <BrandMark className="brand-lockup__logo-image" />
          </span>
          <span className="brand-lockup__copy">
            <small>Quiz-On-The-Go</small>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="site-header__actions">
          <nav className="site-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth actions */}
          {!session ? (
            <div className="header-auth-btns">
              <Link href="/login" className="secondary-button header-btn-sm">
                Log in
              </Link>
              <Link href="/register" className="primary-link header-btn-sm">
                Get started →
              </Link>
            </div>
          ) : (
            <SessionStatus />
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="header-hamburger button-reset"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`hamburger-bar ${menuOpen ? "bar-1-open" : ""}`} />
          <span className={`hamburger-bar ${menuOpen ? "bar-2-open" : ""}`} />
          <span className={`hamburger-bar ${menuOpen ? "bar-3-open" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="header-mobile-menu" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="header-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!session ? (
            <div className="header-mobile-auth">
              <Link href="/login" className="secondary-button wide-button" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/register" className="primary-link wide-button" onClick={() => setMenuOpen(false)}>
                Get started free
              </Link>
            </div>
          ) : (
            <SessionStatus />
          )}
        </nav>
      )}
    </header>
  );

  if (prefersReducedMotion) return headerContent;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      {headerContent}
    </motion.div>
  );
}
