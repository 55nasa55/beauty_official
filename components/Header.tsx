'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Search, Heart } from 'lucide-react';
import { Category, Brand, Collection } from '@/lib/database.types';
import { MiniCart } from './MiniCart';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/lib/auth-context';
import { CosClubLogo } from './CosClubLogo';

interface HeaderProps {
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
}

const primaryNavItems = [
  { label: 'Skincare', href: '/browse?category=skincare' },
  { label: 'Makeup', href: '/browse?category=makeup' },
  { label: 'K-Beauty', href: '/browse?category=korean-beauty' },
  { label: 'J-Beauty', href: '/browse?category=japanese-beauty' },
  { label: 'Sale', href: '/collections/sale', sale: true },
  { label: 'Shop All', href: '/browse' },
];

export function Header({ categories, brands, collections }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearch(false);
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-off-white">
      {/* Announcement Bar */}
      <div className="bg-charcoal text-off-white text-center px-4 py-2.5 text-[14px] tracking-[0.5px] font-body font-normal">
        Members save up to 40% every day ·{' '}
        <Link href="/pricing" className="text-blush-pink font-semibold">
          Join from $6.99/mo →
        </Link>
      </div>

      {/* Global Navigation */}
      <div className="border-b border-soft-rose">
        <div className="px-[5%]">
          <div className="flex items-center justify-between h-[72px] gap-8">
            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-1.5 text-charcoal hover:text-coral transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <CosClubLogo height={48} />
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-nav-link transition-colors"
                  style={item.sale ? { color: 'var(--coral)' } : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-charcoal hover:text-coral transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href={user ? '/account' : '/login'}
                className="text-charcoal hover:text-coral transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <MiniCart />

              <Link
                href="/pricing"
                className="hidden md:inline-flex btn-solid"
                style={{ padding: '8px 16px', fontSize: 14, marginLeft: 8 }}
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search drop-in */}
      {showSearch && (
        <div className="hidden md:block border-b border-light-gray bg-off-white">
          <div className="px-[5%] py-3">
            <SearchBar />
          </div>
        </div>
      )}

      {/* Mobile search */}
      <div className="md:hidden border-b border-light-gray">
        <div className="px-4 py-2.5">
          <SearchBar />
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-light-gray bg-off-white">
          <nav className="px-[5%] py-5 flex flex-col gap-1">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-nav-link"
                style={item.sale ? { color: 'var(--coral)' } : undefined}
                onClick={() => setShowMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-light-gray my-2" />
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse?category=${c.slug}`}
                className="py-2 text-[14px] font-semibold text-charcoal hover:text-coral transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {c.name}
              </Link>
            ))}
            <div className="h-px bg-light-gray my-2" />
            <Link
              href={user ? '/account' : '/login'}
              className="py-2 text-[14px] font-semibold text-charcoal"
              onClick={() => setShowMobileMenu(false)}
            >
              {user ? 'My Account' : 'Sign In'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
