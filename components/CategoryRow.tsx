import Link from 'next/link';
import {
  Sparkles, Flower, Droplets, Brush, Wind, Smile, Bath, Wand,
} from 'lucide-react';

const categories = [
  { label: 'K-Beauty', href: '/browse?category=korean-beauty', icon: Sparkles },
  { label: 'J-Beauty', href: '/browse?category=japanese-beauty', icon: Flower },
  { label: 'Skincare', href: '/browse?category=skincare', icon: Droplets },
  { label: 'Makeup', href: '/browse?category=makeup', icon: Brush },
  { label: 'Hair', href: '/browse?category=hair', icon: Wind },
  { label: 'Face Masks', href: '/browse?category=face-masks', icon: Smile },
  { label: 'Bath & Body', href: '/browse?category=bath-body', icon: Bath },
  { label: 'Tools', href: '/browse?category=makeup-brush-tools', icon: Wand },
];

export function CategoryRow() {
  return (
    <div className="flex justify-center gap-10 py-8 px-[5%] bg-off-white overflow-x-auto scrollbar-hide">
      {categories.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-2 cursor-pointer min-w-[70px] flex-shrink-0 group"
        >
          <div
            className="w-[70px] h-[70px] rounded-full bg-white border border-soft-rose flex items-center justify-center text-coral transition-all duration-200 group-hover:shadow-card-hover"
            style={{ boxShadow: '0 4px 12px rgba(169,201,236,0.15)' }}
          >
            <Icon className="w-[28px] h-[28px]" strokeWidth={2} />
          </div>
          <span className="text-category-label whitespace-nowrap">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
