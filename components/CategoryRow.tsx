import Link from 'next/link';
import {
  Sparkles, Flower, Droplets, Brush, Wind, Smile, Bath, Wand,
} from 'lucide-react';

const categories = [
  { label: 'K-Beauty', href: '/collections/korean-beauty', icon: Sparkles, emoji: '✨' },
  { label: 'J-Beauty', href: '/collections/japanese-beauty', icon: Flower, emoji: '🌸' },
  { label: 'Skincare', href: '/collections/skincare', icon: Droplets, emoji: '💧' },
  { label: 'Makeup', href: '/collections/makeup', icon: Brush, emoji: '💄' },
  { label: 'Hair', href: '/collections/haircare', icon: Wind, emoji: '💇' },
  { label: 'Face Masks', href: '/collections/face-masks', icon: Smile, emoji: '🫧' },
  { label: 'Bath & Body', href: '/collections/bath-body', icon: Bath, emoji: '🛁' },
  { label: 'Tools', href: '/collections/brush-tools', icon: Wand, emoji: '🪄' },
];

export function CategoryRow() {
  return (
    <div className="flex justify-center gap-10 py-8 px-[5%] bg-off-white overflow-x-auto scrollbar-hide">
      {categories.map(({ label, href, icon: Icon, emoji }) => (
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
            {label} {emoji}
          </span>
        </Link>
      ))}
    </div>
  );
}
