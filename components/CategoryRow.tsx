import Link from 'next/link';

const categories = [
  { label: 'K-Beauty', href: '/browse?category=korean-beauty' },
  { label: 'J-Beauty', href: '/browse?category=japanese-beauty' },
  { label: 'Skincare', href: '/browse?category=skincare' },
  { label: 'Makeup', href: '/browse?category=makeup' },
  { label: 'Hair', href: '/browse?category=hair' },
  { label: 'Face Masks', href: '/browse?category=face-masks' },
  { label: 'Bath & Body', href: '/browse?category=bath-body' },
  { label: 'Tools', href: '/browse?category=makeup-brush-tools' },
];

export function CategoryRow() {
  return (
    <div className="flex justify-center gap-10 py-8 px-[5%] bg-off-white overflow-x-auto scrollbar-hide">
      {categories.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-2 cursor-pointer min-w-[70px] flex-shrink-0 group"
        >
          <div
            className="w-[70px] h-[70px] rounded-full bg-white border border-soft-rose flex items-center justify-center text-coral transition-all duration-200 group-hover:shadow-card-hover"
            style={{ boxShadow: '0 4px 12px rgba(169,201,236,0.15)' }}
          />
          <span className="text-category-label whitespace-nowrap">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
