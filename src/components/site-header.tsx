import Link from "next/link";
import { SessionStatus } from "@/components/auth/session-status";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard/teacher", label: "Teacher" },
  { href: "/dashboard/host", label: "Host" },
  { href: "/dashboard/student", label: "Student" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href="/">
          <span className="brand-lockup__mark">Q</span>
          <span>
            <strong>Qez</strong>
            <small>Quiz OS for classrooms and events</small>
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
