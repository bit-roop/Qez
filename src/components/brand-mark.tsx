type BrandMarkProps = {
  className?: string;
};

/**
 * Qez Logo — redesigned
 * A bold "Q" with a lightning bolt tail: communicates "quiz" + "speed".
 * Works at any size, crisp on dark and light backgrounds.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rounded square */}
      <rect width="48" height="48" rx="13" fill="url(#qez_bg)" />

      {/* Q ring */}
      <circle cx="22" cy="21" r="10" stroke="white" strokeWidth="4" fill="none" />

      {/* Q tail → lightning bolt extends from bottom-right of the Q */}
      <path
        d="M29 28 L36 40 L29 37 L31 44 L22 32"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Small inner dot — like a question mark / quiz bubble */}
      <circle cx="22" cy="21" r="3.5" fill="white" opacity="0.9" />

      <defs>
        <linearGradient id="qez_bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B5EFF" />
          <stop offset="100%" stopColor="#4E46C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
