type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="qezBlue" x1="20" y1="30" x2="135" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3CA6F7" />
          <stop offset="1" stopColor="#2563C8" />
        </linearGradient>
        <linearGradient id="qezTeal" x1="82" y1="30" x2="158" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2CD3BF" />
          <stop offset="1" stopColor="#179C9C" />
        </linearGradient>
        <linearGradient id="qezOrange" x1="58" y1="52" x2="126" y2="136" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFAA2B" />
          <stop offset="1" stopColor="#F47C1D" />
        </linearGradient>
      </defs>
      <path
        d="M90 22C53.55 22 24 51.55 24 88C24 124.45 53.55 154 90 154C103.925 154 116.845 149.655 127.48 142.255L143.95 158.675C146.94 161.675 151.79 161.675 154.79 158.675C157.79 155.675 157.79 150.825 154.79 147.825L138.44 131.535C147.845 120.64 153.5 106.455 153.5 91C153.5 53.997 123.003 22 86 22H90ZM90 41C115.405 41 136 61.595 136 87C136 112.405 115.405 133 90 133C64.595 133 44 112.405 44 87C44 61.595 64.595 41 90 41Z"
        fill="url(#qezBlue)"
      />
      <path
        d="M83 40C114.86 40 140.86 64.98 142.89 96.34C143.06 98.94 145.15 101 147.76 101H160.37C163.31 101 165.64 98.49 165.39 95.56C162.33 52.97 126.67 19 83 19C76.73 19 70.65 19.7 64.82 21.02C61.28 21.82 59.72 26.01 61.95 28.87L69.52 38.61C70.7 40.12 72.72 40.72 74.57 40.29C77.3 39.66 80.11 39.32 83 39.32V40Z"
        fill="url(#qezTeal)"
      />
      <path
        d="M90.27 55C103.3 55 113 63.21 113 75.27C113 84.89 106.71 92.19 97.26 95.83V105.3H83.4V88.04C93.11 85.99 98.83 81.16 98.83 74.15C98.83 67.46 93.37 63.11 85.42 63.11C79.6 63.11 73.67 65.42 68.59 69.52L60.67 57.76C67.77 51.85 78.08 48 90.27 48V55ZM82.72 123.17C82.72 117.71 86.94 113.49 92.4 113.49C97.86 113.49 102.08 117.71 102.08 123.17C102.08 128.63 97.86 132.85 92.4 132.85C86.94 132.85 82.72 128.63 82.72 123.17Z"
        fill="url(#qezOrange)"
      />
      <path
        d="M123.5 67.5L165 67.5L165 109"
        stroke="url(#qezOrange)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="14"
      />
      <path
        d="M118 112L165 67"
        stroke="url(#qezOrange)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="14"
      />
    </svg>
  );
}
