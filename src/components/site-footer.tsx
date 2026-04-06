import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__column">
          <strong>Qez</strong>
          <p>Precision-driven quizzes for classrooms, competitions, and live events.</p>
        </div>

        <div className="site-footer__column">
          <strong>Product</strong>
          <div className="site-footer__links site-footer__links--stack">
            <Link href="/#features">Features</Link>
            <Link href="/#academic-mode">Academic Mode</Link>
            <Link href="/#webinar-mode">Webinar Mode</Link>
            <Link href="/#leaderboard">Leaderboard</Link>
          </div>
        </div>

        <div className="site-footer__column">
          <strong>Company</strong>
          <div className="site-footer__links site-footer__links--stack">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>

        <div className="site-footer__column site-footer__meta">
          <strong>Built with</strong>
          <span>Next.js</span>
          <span>Prisma</span>
          <span>PostgreSQL (Neon)</span>
          <span>Made by an anonymous duo</span>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 Qez. All rights reserved.</span>
      </div>
    </footer>
  );
}
