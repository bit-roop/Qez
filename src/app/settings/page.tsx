"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { ProfileSettingsClient } from "@/components/profile/profile-settings-client";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <SessionGate description="Login to manage your Qez profile." title="Profile Settings">
        {(session) => <ProfileSettingsClient session={session} />}
      </SessionGate>
    </main>
  );
}
