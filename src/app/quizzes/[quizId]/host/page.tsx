"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { WebinarHostControlClient } from "@/components/webinar/webinar-host-control-client";

type WebinarHostControlPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function WebinarHostControlPage({ params }: WebinarHostControlPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["WEBINAR_HOST", "ADMIN"]}
        description="Login to control this webinar quiz."
        title="Webinar Host Control"
      >
        {(session) => (
          <WebinarHostControlClient quizId={resolvedParams.quizId} session={session} />
        )}
      </SessionGate>
    </main>
  );
}
