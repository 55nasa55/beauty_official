interface CosClubLogoProps {
  height?: number;
  className?: string;
}

const LOGO_URL =
  'https://gwwnscgpfurcbkqmfpbq.supabase.co/storage/v1/object/public/product-images/1787128113755-aer6alkl97.png';

export function CosClubLogo({ height = 48, className }: CosClubLogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="CosClub"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  );
}
