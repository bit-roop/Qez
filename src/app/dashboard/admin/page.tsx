"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default function AdminDashboardPage() {
  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["ADMIN"]}
        description="Login with an admin account to open the system overview."
        title="Admin Dashboard"
      >
        {(session) => <AdminDashboardClient session={session} />}
      </SessionGate>
    </main>
  );
}
