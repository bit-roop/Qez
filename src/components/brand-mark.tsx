type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="qezGold" x1="34" y1="24" x2="168" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E6D3A3" />
          <stop offset="0.52" stopColor="#C2A36B" />
          <stop offset="1" stopColor="#8C6B3F" />
        </linearGradient>
        <linearGradient id="qezGoldSoft" x1="52" y1="46" x2="164" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F0E2BC" />
          <stop offset="1" stopColor="#A9864F" />
        </linearGradient>
        <linearGradient id="qezDark" x1="70" y1="52" x2="154" y2="154" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4A3921" />
          <stop offset="1" stopColor="#231A10" />
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="66" fill="#14110D" stroke="url(#qezGold)" strokeWidth="12" />
      <circle cx="110" cy="110" r="46" fill="#111111" stroke="url(#qezGoldSoft)" strokeWidth="7" />
      <path d="M110 12L117 30H103L110 12Z" fill="url(#qezGold)" />
      <path d="M110 208L103 190H117L110 208Z" fill="url(#qezGold)" />
      <path d="M12 110L30 103V117L12 110Z" fill="url(#qezGold)" />
      <path d="M208 110L190 117V103L208 110Z" fill="url(#qezGold)" />
      <circle cx="110" cy="110" r="86" stroke="rgba(194,163,107,0.35)" strokeDasharray="8 10" strokeWidth="3" />
      <path
        d="M92 78C92 66 100.6 58 112.2 58C123.8 58 132 64.6 132 75C132 83.2 126.8 88.8 118 92.2V102H104V86.5C113 84.4 118 80.5 118 74.8C118 69.9 114.2 66.8 108.4 66.8C103.4 66.8 98.4 68.8 93.8 72.9L86.2 63.4C92.6 57.5 101.2 54 112 54C129.2 54 144 64.2 144 79.6C144 92.4 135.5 100.7 122 105.1V117H98V96.4C111.1 93.9 118.5 88.7 118.5 80.9C118.5 73.8 113.2 69.4 105.6 69.4C99.8 69.4 94.2 71.9 88.9 76.4L92 78Z"
        fill="url(#qezGoldSoft)"
      />
      <circle cx="110" cy="144" r="10" fill="url(#qezGold)" />
      <path d="M69 45L56 32L66 22L79 35L69 45Z" fill="url(#qezGold)" opacity="0.88" />
      <path d="M151 45L141 35L154 22L164 32L151 45Z" fill="url(#qezGold)" opacity="0.88" />
      <path d="M69 175L79 185L66 198L56 188L69 175Z" fill="url(#qezGold)" opacity="0.88" />
      <path d="M151 175L164 188L154 198L141 185L151 175Z" fill="url(#qezGold)" opacity="0.88" />
      <path d="M123 123L165 82" stroke="url(#qezDark)" strokeLinecap="round" strokeWidth="9" />
      <path d="M151 78H176V103" stroke="url(#qezGold)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
      <path d="M96 113L110 126L126 96" stroke="url(#qezDark)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
    </svg>
  );
}
