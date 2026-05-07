'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Category, Brand, Collection } from '@/lib/database.types';
import { MiniCart } from './MiniCart';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
}

const secondaryNavItems = [
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  { label: 'New', href: '/collections/new' },
  { label: 'Sale', href: '/collections/sale' },
  { label: 'Brands', href: '/brands' },
  { label: 'Browse All', href: '/browse' },
  { label: 'K-Beauty', href: '/collections/korean-beauty' },
  { label: 'J-Beauty', href: '/collections/japanese-beauty' },
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'Makeup', href: '/collections/makeup' },
  { label: 'Suncare', href: '/collections/suncare' },
  { label: 'Hair', href: '/collections/haircare' },
];

/* Soft feminine SVG icons — inline so no external deps */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function Header({ categories, brands, collections }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMegaMenuEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setShowMegaMenu(true);
  };

  const handleMegaMenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setShowMegaMenu(false), 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setShowMegaMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowMegaMenu(false); setShowSearch(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); }, []);

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: 'rgba(253,248,245,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* ── Primary row ── */}
      <div className="border-b border-rose-100/80">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="flex items-center justify-between h-[62px] gap-8">

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-1.5 text-rose-300 hover:text-rose-500 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-baseline gap-1 select-none group">
              <span className="text-[18px] font-semibold tracking-[0.06em] text-[#3a2a2a] group-hover:text-[#5a3a3a] transition-colors">Cosmetic</span>
              <span className="text-[18px] font-semibold tracking-[0.06em] text-[#d4909e] group-hover:text-[#c07888] transition-colors">Club</span>
              {/* Subtle decorative dot */}
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-rose-300/70 mb-[3px] hidden md:block" />
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden md:flex items-center gap-9 flex-1 justify-center">
              <div
                ref={megaMenuRef}
                onMouseEnter={handleMegaMenuEnter}
                onMouseLeave={handleMegaMenuLeave}
                className="relative"
              >
                <button className="text-[13px] font-medium text-[#7a5a5a] hover:text-[#c07888] transition-colors tracking-wide">
                  Skincare
                </button>
                {showMegaMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[520px] rounded-2xl border border-rose-100 shadow-xl shadow-rose-100/30 p-6 z-50"
                    style={{ background: 'rgba(253,248,245,0.98)', backdropFilter: 'blur(16px)' }}>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/collections/${category.slug}`}
                          className="text-[13px] text-[#7a5a5a] hover:text-[#c07888] transition-colors py-1.5 px-2 rounded-lg hover:bg-rose-50"
                          onClick={() => setShowMegaMenu(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/collections/makeup" className="text-[13px] font-medium text-[#7a5a5a] hover:text-[#c07888] transition-colors tracking-wide">
                Makeup
              </Link>
              <Link href="/collections/korean-beauty" className="text-[13px] font-medium text-[#7a5a5a] hover:text-[#c07888] transition-colors tracking-wide">
                K-Beauty
              </Link>
              <Link href="/collections/japanese-beauty" className="text-[13px] font-medium text-[#7a5a5a] hover:text-[#c07888] transition-colors tracking-wide">
                J-Beauty
              </Link>
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="hidden md:flex w-8 h-8 items-center justify-center text-[#c4909e] hover:text-[#d4607a] hover:bg-rose-50 rounded-full transition-all duration-150"
                aria-label="Search"
              >
                <SearchIcon />
              </button>

              <button
                className="hidden md:flex w-8 h-8 items-center justify-center text-[#c4909e] hover:text-rose-400 hover:bg-rose-50 rounded-full transition-all duration-150"
                aria-label="Wishlist"
              >
                <HeartIcon />
              </button>

              {/* Cart inherits its own styling from MiniCart */}
              <MiniCart />

              <Link
                href={user ? '/account' : '/login'}
                className="hidden md:inline-flex items-center h-8 px-4 ml-1 rounded-full text-[12px] font-semibold text-white transition-all duration-150 shadow-sm hover:shadow"
                style={{ background: 'linear-gradient(135deg, #e8a0b0 0%, #d4707e 100%)' }}
              >
                {user ? 'Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search drop-in */}
      {showSearch && (
        <div className="hidden md:block border-b border-rose-100/60" style={{ background: 'rgba(253,248,245,0.98)' }}>
          <div className="max-w-[1320px] mx-auto px-6 py-3">
            <SearchBar />
          </div>
        </div>
      )}

      {/* ── Secondary category strip ── */}
      <div className="hidden md:block border-b border-rose-100/50" style={{ background: 'rgba(253,248,245,0.95)' }}>
        <div className="max-w-[1320px] mx-auto px-6">
          <nav className="flex items-center justify-center gap-7 h-[38px]">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11.5px] font-medium text-[#b08898] hover:text-[#d4607a] transition-colors tracking-wide whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden border-b border-rose-100/60">
        <div className="px-4 py-2.5">
          <SearchBar />
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-rose-100" style={{ background: 'rgba(253,248,245,0.98)' }}>
          <nav className="max-w-[1320px] mx-auto px-6 py-5 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-widest text-rose-300 font-semibold mb-2">Categories</div>
            {categories.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="py-2 text-[13px] text-[#7a5a5a] hover:text-[#c07888] transition-colors" onClick={() => setShowMobileMenu(false)}>
                {c.name}
              </Link>
            ))}
            <div className="h-px bg-rose-100 my-2" />
            <div className="text-[10px] uppercase tracking-widest text-rose-300 font-semibold mb-2">Shop</div>
            {secondaryNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="py-2 text-[13px] text-[#7a5a5a] hover:text-[#c07888] transition-colors" onClick={() => setShowMobileMenu(false)}>
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-rose-100 my-2" />
            <Link href={user ? '/account' : '/login'} className="py-2 text-[13px] font-semibold text-[#d4707e]" onClick={() => setShowMobileMenu(false)}>
              {user ? 'My Account' : 'Sign In'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
