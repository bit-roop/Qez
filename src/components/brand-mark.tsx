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
      viewBox="0 0 126 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="123" height="49" rx="24.5" fill="#121318" stroke="#1e2130" strokeWidth="3" />
      <ellipse cx="27" cy="26" rx="14" ry="13.5" stroke="#ffffff" strokeWidth="4.4" />
      <path
        d="M34.5 34.5L43 43.2L35.5 41L36.8 48L25.3 34.2"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M54.8 34V17.7H68.1V21.7H59.8V24.1H67.3V28H59.8V30H68.4V34H54.8Z"
        fill="url(#qez_word)"
      />
      <path
        d="M70.8 34V30.6L78 22H71.2V17.7H84.3V21L77.3 29.7H84.4V34H70.8Z"
        fill="url(#qez_word)"
      />
      <defs>
        <linearGradient id="qez_word" x1="54" y1="15" x2="86" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b79dff" />
          <stop offset="100%" stopColor="#7656ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
