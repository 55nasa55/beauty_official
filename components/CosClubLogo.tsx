interface CosClubLogoProps {
  height?: number;
  className?: string;
}

export function CosClubLogo({ height = 48, className }: CosClubLogoProps) {
  const width = (height * 620) / 140;

  return (
    <svg
      className={className}
      viewBox="0 0 620 140"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CosClub"
    >
      <style>{`.cosclub-logo-text { font-family: var(--font-quicksand), 'Quicksand', sans-serif; font-weight: 650; font-size: 96px; }`}</style>
      <text x="60" y="108" className="cosclub-logo-text">
        <tspan fill="#A9C9E8">Cos</tspan>
        <tspan fill="#888888">Club</tspan>
      </text>
      <g transform="translate(408,34)">
        <path d="M0,-20 C3,-3 3,-3 20,0 C3,3 3,3 0,20 C-3,3 -3,3 -20,0 C-3,-3 -3,-3 0,-20Z" fill="#E8A9C4" />
      </g>
      <g transform="translate(432,18)">
        <path d="M0,-10 C2,-2 2,-2 10,0 C2,2 2,2 0,10 C-2,2 -2,2 -10,0 C-2,-2 -2,-2 0,-10Z" fill="#E8A9C4" />
      </g>
    </svg>
  );
}
