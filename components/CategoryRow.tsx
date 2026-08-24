import Link from 'next/link';

const KoreaFlag = () => (
  <svg width="36" height="26" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="26" rx="3" fill="white" stroke="#E8E8E8" strokeWidth="0.5" />
    {/* Taegeuk */}
    <circle cx="18" cy="13" r="5" fill="#EE324E" />
    <path d="M18 8 A5 5 0 0 1 18 18 A2.5 2.5 0 0 0 18 13 A2.5 2.5 0 0 1 18 8Z" fill="#007088" />
    {/* Trigrams - top left (heaven) */}
    <g transform="translate(6.5, 4.5) rotate(-34)" stroke="#1A1A1A" strokeWidth="1" strokeLinecap="round">
      <line x1="-3" y1="-3" x2="3" y2="-3" />
      <line x1="-3" y1="0" x2="3" y2="0" />
      <line x1="-3" y1="3" x2="3" y2="3" />
    </g>
    {/* Trigrams - bottom right (heaven) */}
    <g transform="translate(29.5, 21.5) rotate(-34)" stroke="#1A1A1A" strokeWidth="1" strokeLinecap="round">
      <line x1="-3" y1="-3" x2="3" y2="-3" />
      <line x1="-3" y1="0" x2="3" y2="0" />
      <line x1="-3" y1="3" x2="3" y2="3" />
    </g>
    {/* Trigrams - top right (water) */}
    <g transform="translate(29.5, 4.5) rotate(34)" stroke="#1A1A1A" strokeWidth="1" strokeLinecap="round">
      <line x1="-3" y1="-3" x2="3" y2="-3" />
      <line x1="-3" y1="3" x2="3" y2="3" />
    </g>
    {/* Trigrams - bottom left (water) */}
    <g transform="translate(6.5, 21.5) rotate(34)" stroke="#1A1A1A" strokeWidth="1" strokeLinecap="round">
      <line x1="-3" y1="-3" x2="3" y2="-3" />
      <line x1="-3" y1="3" x2="3" y2="3" />
    </g>
  </svg>
);

const JapanFlag = () => (
  <svg width="36" height="26" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="26" rx="3" fill="white" stroke="#E8E8E8" strokeWidth="0.5" />
    <circle cx="18" cy="13" r="5" fill="#EE324E" />
  </svg>
);

const categories = [
  {
    label: 'K-Beauty',
    href: '/browse?category=korean-beauty',
    icon: <KoreaFlag />,
  },
  {
    label: 'J-Beauty',
    href: '/browse?category=japanese-beauty',
    icon: <JapanFlag />,
  },
  {
    label: 'Skincare',
    href: '/browse?category=skincare',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="9" width="10" height="13" rx="2" />
        <path d="M10 9V7h4v2" />
        <path d="M12 7V4" />
        <path d="M10 4h4" />
        <path d="M10 13h4" />
      </svg>
    ),
  },
  {
    label: 'Makeup',
    href: '/browse?category=makeup',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="13" width="8" height="7" rx="1.5" />
        <rect x="4" y="9" width="6" height="4" rx="0.5" />
        <path d="M5 9V6.5L7 3.5L9 6.5V9" />
        <rect x="13" y="14" width="7" height="6" rx="1.5" />
        <rect x="14" y="12" width="5" height="2" rx="0.5" />
        <line x1="14.5" y1="13" x2="18.5" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Hair',
    href: '/browse?category=hair',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Face Masks',
    href: '/browse?category=face-masks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
      </svg>
    ),
  },
  {
    label: 'Bath & Body',
    href: '/browse?category=bath-body',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3 C8 3 4 8 4 11.5 a4 4 0 0 0 8 0 C12 8 8 3 8 3z" />
        <path d="M7.2 10 Q6.5 11.5 7 12.5" />
        <path d="M17 2 C17 2 14.5 5.5 14.5 7.5 a2.5 2.5 0 0 0 5 0 C19.5 5.5 17 2 17 2z" />
        <path d="M16.5 6.5 Q16 7.2 16.3 8" />
        <path d="M17 13 C17 13 14.5 16.5 14.5 18.5 a2.5 2.5 0 0 0 5 0 C19.5 16.5 17 13 17 13z" />
        <path d="M16.5 17.5 Q16 18.2 16.3 19" />
      </svg>
    ),
  },
  {
    label: 'Tools',
    href: '/browse?category=makeup-brush-tools',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 Q20 2 21 5 Q22 9 18 11 L13 11 Q11 9 12 5 Q12 2 13 2z" />
        <line x1="14" y1="10" x2="16" y2="4" />
        <line x1="16" y1="10.5" x2="19" y2="5.5" />
        <rect x="10.5" y="11" width="4" height="2.5" rx="0.5" />
        <path d="M11 13.5 L3.5 21 Q2.5 22 2 21.5 Q1.5 21 2.5 20 L10.5 13.5" />
      </svg>
    ),
  },
];

export function CategoryRow() {
  return (
    <div className="flex justify-center gap-10 py-8 px-[5%] bg-off-white overflow-x-auto scrollbar-hide">
      {categories.map(({ label, href, icon }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-2 cursor-pointer min-w-[70px] flex-shrink-0 group"
        >
          <div
            className="w-[70px] h-[70px] rounded-full bg-white border border-soft-rose flex items-center justify-center text-coral transition-all duration-200 group-hover:shadow-card-hover"
            style={{ boxShadow: '0 4px 12px rgba(169,201,236,0.15)' }}
          >
            {icon}
          </div>
          <span className="text-category-label whitespace-nowrap">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
