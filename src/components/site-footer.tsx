"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function SiteFooter() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__left">
            <span className="site-footer__brand">© 2026 Qez</span>
            <nav className="site-footer__nav">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </div>
          <span className="site-footer__credit">Made with care · Next.js + Prisma</span>
        </div>
      </footer>
    );
  }

  return (
    <motion.footer
      className="site-footer"
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
    >
      <div className="site-footer__inner">
        <div className="site-footer__left">
          <span className="site-footer__brand">© 2026 Qez</span>
          <nav className="site-footer__nav">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
        <span className="site-footer__credit">Made with care · Next.js + Prisma</span>
      </div>
    </motion.footer>
  );
}
