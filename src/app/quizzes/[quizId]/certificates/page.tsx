"use client";

import { use } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { WinnerCertificateClient } from "@/components/webinar/winner-certificate-client";

type QuizCertificatesPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizCertificatesPage({ params }: QuizCertificatesPageProps) {
  const resolvedParams = use(params);

  return (
    <main className="page-shell">
      <SessionGate
        allowedRoles={["WEBINAR_HOST", "ADMIN"]}
        description="Login with a webinar host or admin account to export winners."
        title="Winner Certificates"
      >
        {() => <WinnerCertificateClient quizId={resolvedParams.quizId} />}
      </SessionGate>
    </main>
  );
}
