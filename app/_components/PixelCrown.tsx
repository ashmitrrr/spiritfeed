/** Small blocky crown badge for the current spirit_crown holder. */
export function PixelCrown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 14"
      className={className}
      aria-hidden
      shapeRendering="crispEdges"
    >
      <path
        d="M1 12 L1 4 L5 8 L8 2 L11 8 L15 4 L15 12 Z"
        fill="#f2c14e"
        stroke="#322e27"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      <rect x="1" y="11" width="14" height="2" fill="#e0a92e" />
    </svg>
  )
}
