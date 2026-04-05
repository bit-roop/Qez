export const avatarPresets = [
  { key: "ember", label: "Ember", accent: "linear-gradient(135deg, #ff7f51, #ffb36a)" },
  { key: "mint", label: "Mint", accent: "linear-gradient(135deg, #41d6c3, #8cf3d8)" },
  { key: "aurora", label: "Aurora", accent: "linear-gradient(135deg, #6b7cff, #9aa8ff)" },
  { key: "sunset", label: "Sunset", accent: "linear-gradient(135deg, #ff6b4a, #ffd166)" },
  { key: "orchid", label: "Orchid", accent: "linear-gradient(135deg, #ff7bb0, #9c7cff)" },
  { key: "teal", label: "Teal", accent: "linear-gradient(135deg, #1fb5a9, #6de6d0)" }
] as const;

export function getAvatarPreset(avatarKey?: string | null) {
  return avatarPresets.find((preset) => preset.key === avatarKey) ?? avatarPresets[0];
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
