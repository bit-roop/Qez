"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getDefaultDashboardPath, saveSession } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

function OAuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const role = searchParams.get("role") as AuthSession["user"]["role"] | null;

    if (!token || !id || !email || !name || !role) {
      setError("Google sign-in could not be completed.");
      return;
    }

    saveSession({
      token,
      user: {
        id,
        email,
        name,
        role
      }
    });

    router.replace(getDefaultDashboardPath(role));
    router.refresh();
  }, [router, searchParams]);

  return (
    <main className="page-shell">
      <section className="card auth-state-card">
        <span className="eyebrow">Google Sign-In</span>
        <h1>{error ? "Sign-in failed" : "Finishing sign-in..."}</h1>
        <p className="section-copy">
          {error ?? "Please wait while we open your dashboard."}
        </p>
      </section>
    </main>
  );
}

export default function OAuthCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthCompleteContent />
    </Suspense>
  );
}
