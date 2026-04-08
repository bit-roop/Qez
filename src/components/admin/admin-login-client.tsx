"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveSession } from "@/lib/client-auth";
import { BrandMark } from "@/components/brand-mark";
import { AuthSession } from "@/types/client-auth";

export function AdminLoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        })
      });

      const data = (await response.json()) as { error?: string } & AuthSession;

      if (!response.ok) {
        throw new Error(data.error ?? "Admin login failed.");
      }

      saveSession(data);
      router.push("/dashboard/admin");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel-brand auth-panel-brand--admin">
        <BrandMark className="brand-hero-mark" />
        <span className="eyebrow">Admin Portal</span>
        <h1>System control for Qez.</h1>
        <p className="section-copy">
          Use this only for platform-level monitoring, user review, and global quiz oversight.
        </p>
      </section>

      <section className="auth-panel auth-panel-form">
        <span className="eyebrow">Secure Access</span>
        <h2>Admin login</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Admin email</span>
            <input name="email" placeholder="admin@example.com" required type="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <input name="password" placeholder="Enter admin password" required type="password" />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-link button-reset wide-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Opening..." : "Open admin dashboard"}
          </button>
        </form>

        <p className="auth-switch">
          <Link href="/login">Back to regular login</Link>
        </p>
      </section>
    </div>
  );
}
