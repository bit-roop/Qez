import Link from "next/link";

export function SiteFooter() {
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
