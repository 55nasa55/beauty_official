import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabasePublic } from '@/lib/supabase/public';
import { Category, Brand, Collection } from '@/lib/database.types';

async function getNavData() {
  const supabase = supabasePublic;
  try {
    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('collections').select('*').order('name'),
    ]);
    return {
      categories: (categoriesResult.data || []) as Category[],
      brands: (brandsResult.data || []) as Brand[],
      collections: (collectionsResult.data || []) as Collection[],
    };
  } catch {
    return { categories: [], brands: [], collections: [] };
  }
}

const quickLinks = [
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'K-Beauty', href: '/collections/korean-beauty' },
  { label: 'J-Beauty', href: '/collections/japanese-beauty' },
  { label: 'Makeup', href: '/collections/makeup' },
  { label: 'Membership', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
];

const SparkleIcon = ({ className }: { className: string }) => (
  <svg className={`sparkle ${className}`} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M20,0 C23,10 23,10 40,20 C23,23 23,23 20,40 C17,23 17,23 0,20 C17,17 17,17 20,0Z" />
  </svg>
);

export default async function NotFound() {
  const { categories, brands, collections } = await getNavData();

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <Header categories={categories} brands={brands} collections={collections} />

      {/* 404 Content */}
      <div
        className="error-page flex-1 flex flex-col items-center justify-center text-center"
        style={{
          padding: '80px 5%',
          background: 'linear-gradient(160deg, #f5f9fe 0%, var(--off-white) 60%)',
        }}
      >
        <div className="sparkle-wrap relative inline-block">
          <div
            className="error-number"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '140px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-4px',
              background: 'linear-gradient(135deg, var(--blush-pink), var(--soft-rose))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              position: 'relative',
            }}
          >
            404
          </div>
          <SparkleIcon className="sp1" />
          <SparkleIcon className="sp2" />

          <style>{`
            .sparkle { position: absolute; fill: #E8A9C4; }
            .sp1 { top: 10px; right: -30px; width: 22px; }
            .sp2 { bottom: 20px; left: -24px; width: 14px; }
            @media (max-width: 768px) {
              .error-number { font-size: 100px !important; }
              .error-title { font-size: 22px !important; }
            }
          `}</style>
        </div>

        <h1
          className="error-title"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          This page went out of stock.
        </h1>
        <p
          className="error-subtitle"
          style={{
            fontSize: '16px',
            color: 'var(--gray)',
            maxWidth: '420px',
            lineHeight: 1.7,
            marginBottom: '40px',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
          back to the good stuff.
        </p>

        <div
          className="error-actions flex flex-wrap gap-[14px] justify-center"
          style={{ marginBottom: '64px' }}
        >
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
            style={{
              background: 'var(--baby-blue)',
              color: 'var(--charcoal)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: 'var(--font-body)',
              border: 'none',
              transition: 'background 0.2s',
            }}
          >
            <Home size={16} /> Back to Home
          </Link>
          <Link
            href="/browse"
            className="btn-ghost inline-flex items-center gap-2"
            style={{
              background: 'transparent',
              color: 'var(--charcoal)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: 'var(--font-body)',
              border: '2px solid var(--light-gray)',
              transition: 'all 0.2s',
            }}
          >
            <ShoppingBag size={16} /> Browse the Shop
          </Link>
        </div>

        <div className="quick-links flex flex-wrap gap-3 justify-center">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="quick-link"
              style={{
                padding: '8px 18px',
                border: '1.5px solid var(--light-gray)',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--gray)',
                transition: 'all 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
