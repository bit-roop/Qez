"use client";

import { FormEvent, useMemo, useState } from "react";
import { apiFetch, saveSession } from "@/lib/client-auth";
import { avatarPresets, getAvatarPreset, getInitials } from "@/lib/profile";
import { AuthSession } from "@/types/client-auth";

type ProfileResponse = {
  profile: AuthSession["user"];
};

type ProfileSettingsClientProps = {
  session: AuthSession;
};

export function ProfileSettingsClient({ session }: ProfileSettingsClientProps) {
  const [name, setName] = useState(session.user.name);
  const [institution, setInstitution] = useState(session.user.institution ?? "");
  const [bio, setBio] = useState(session.user.bio ?? "");
  const [avatarKey, setAvatarKey] = useState(session.user.avatarKey ?? avatarPresets[0].key);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePreset = useMemo(() => getAvatarPreset(avatarKey), [avatarKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetch<ProfileResponse>("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          institution,
          bio,
          avatarKey
        })
      });

      saveSession({
        ...session,
        user: {
          ...data.profile
        }
      });
      setMessage("Profile updated successfully.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="profile-shell">
      <article className="dashboard-hero profile-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Profile Settings</span>
          <h1>Make your dashboard feel like yours.</h1>
          <p className="section-copy">
            Update your display name, add context like institution, and pick a preset avatar for headers and dashboards.
          </p>
        </div>

        <div className="profile-preview-card">
          <div className="profile-avatar-large" style={{ background: activePreset.accent }}>
            {getInitials(name || session.user.name)}
          </div>
          <strong>{name}</strong>
          <span>{session.user.role.replaceAll("_", " ")}</span>
          {institution ? <span>{institution}</span> : null}
        </div>
      </article>

      <div className="profile-grid">
        <article className="card">
          <span className="eyebrow">Edit Profile</span>
          <h2>Identity</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Display name</span>
              <input onChange={(event) => setName(event.target.value)} type="text" value={name} />
            </label>

            <label className="field">
              <span>Institution</span>
              <input
                onChange={(event) => setInstitution(event.target.value)}
                placeholder="Example: SRM Institute of Science and Technology"
                type="text"
                value={institution}
              />
            </label>

            <label className="field">
              <span>Short bio</span>
              <textarea
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell your team or students who you are."
                rows={4}
                value={bio}
              />
            </label>

            {message ? <p className="form-success">{message}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>

        <article className="card">
          <span className="eyebrow">Avatar Presets</span>
          <h2>Choose a profile look</h2>
          <div className="avatar-grid">
            {avatarPresets.map((preset) => (
              <button
                className={`avatar-choice ${avatarKey === preset.key ? "avatar-choice--active" : ""}`}
                key={preset.key}
                onClick={() => setAvatarKey(preset.key)}
                type="button"
              >
                <span className="profile-avatar-small" style={{ background: preset.accent }}>
                  {getInitials(name || session.user.name)}
                </span>
                <strong>{preset.label}</strong>
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
