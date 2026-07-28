interface CosClubLogoProps {
  height?: number;
  className?: string;
}

export function CosClubLogo({ height = 48, className }: CosClubLogoProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-quicksand), Quicksand, sans-serif',
        fontSize: `${(height * 0.55).toFixed(0)}px`,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: '#A9C9E8' }}>Cos</span>
      <span style={{ color: '#888888' }}>Club</span>
    </span>
  );
}
