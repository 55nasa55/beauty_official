'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Heart } from 'lucide-react';
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

export function Header({ categories, brands, collections }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMegaMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowMegaMenu(true);
  };

  const handleMegaMenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setShowMegaMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMegaMenu(false);
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full bg-white">
      {/* Primary nav row */}
      <div className="border-b border-stone-200/80">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="flex items-center justify-between h-[60px] gap-8">

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-0.5 select-none">
              <span className="text-[17px] font-medium tracking-[0.08em] text-stone-800">Cosmetic</span>
              <span className="text-[17px] font-medium tracking-[0.08em] text-rose-300/90 ml-1">Club</span>
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <div
                ref={megaMenuRef}
                onMouseEnter={handleMegaMenuEnter}
                onMouseLeave={handleMegaMenuLeave}
                className="relative"
              >
                <button className="text-[13px] font-medium text-stone-500 hover:text-stone-800 transition-colors tracking-wide">
                  Skincare
                </button>
                {showMegaMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[480px] bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-100 p-6 z-50">
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/collections/${category.slug}`}
                          className="group text-sm text-stone-600 hover:text-stone-900 transition-colors py-1"
                          onClick={() => setShowMegaMenu(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/collections/makeup" className="text-[13px] font-medium text-stone-500 hover:text-stone-800 transition-colors tracking-wide">
                Makeup
              </Link>
              <Link href="/collections/korean-beauty" className="text-[13px] font-medium text-stone-500 hover:text-stone-800 transition-colors tracking-wide">
                K-Beauty
              </Link>
              <Link href="/collections/japanese-beauty" className="text-[13px] font-medium text-stone-500 hover:text-stone-800 transition-colors tracking-wide">
                J-Beauty
              </Link>
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-3">
              {/* Search toggle — desktop */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="hidden md:flex p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-[17px] h-[17px]" />
              </button>

              <button className="hidden md:flex p-1.5 text-stone-500 hover:text-stone-800 transition-colors" aria-label="Wishlist">
                <Heart className="w-[17px] h-[17px]" />
              </button>

              <MiniCart />

              <Link
                href={user ? '/account' : '/login'}
                className="hidden md:inline-flex text-[13px] font-medium text-rose-300/90 hover:text-rose-400 transition-colors tracking-wide whitespace-nowrap"
              >
                {user ? 'Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar drop-down */}
      {showSearch && (
        <div className="hidden md:block border-b border-stone-200/80 bg-white">
          <div className="max-w-[1320px] mx-auto px-6 py-3">
            <SearchBar />
          </div>
        </div>
      )}

      {/* Secondary nav row — desktop */}
      <div className="hidden md:block border-b border-stone-100">
        <div className="max-w-[1320px] mx-auto px-6">
          <nav className="flex items-center justify-center gap-7 h-[38px]">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11.5px] font-medium text-stone-400 hover:text-stone-700 transition-colors tracking-wide whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden border-b border-stone-100">
        <div className="px-4 py-2.5">
          <SearchBar />
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-stone-200 bg-white">
          <nav className="max-w-[1320px] mx-auto px-6 py-5 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">Categories</div>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                className="py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {category.name}
              </Link>
            ))}
            <div className="h-px bg-stone-100 my-2" />
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">Shop</div>
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-stone-100 my-2" />
            <Link
              href={user ? '/account' : '/login'}
              className="py-2 text-sm text-rose-400 font-medium"
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
