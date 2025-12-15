'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { Category, Brand, Collection } from '@/lib/database.types';
import { MiniCart } from './MiniCart';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
}

export function Header({ categories, brands, collections }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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
      }
    };

    if (showMegaMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMegaMenu]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full bg-white border-b border-black/10">
      {/* Row 1: Logo, Search, Icons */}
      <div className="border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 py-3">
            {/* Left: Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-gray-50 rounded-md transition-colors mr-2"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <Link href="/" className="text-xl md:text-2xl font-light tracking-wider whitespace-nowrap">
                Cosmetic Club
              </Link>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex justify-center">
              <div className="w-full max-w-[720px] mx-auto">
                <SearchBar />
              </div>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center justify-end gap-2 md:gap-3 whitespace-nowrap">
              <MiniCart />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Navigation */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-6 py-2">
            <div
              ref={megaMenuRef}
              onMouseEnter={handleMegaMenuEnter}
              onMouseLeave={handleMegaMenuLeave}
            >
              <button
                onClick={() => setShowMegaMenu(!showMegaMenu)}
                className="flex items-center gap-2 text-sm font-medium text-black/80 hover:text-black transition-colors py-2"
              >
                <Menu className="w-4 h-4" />
                Categories
              </button>

              {/* Full-Width Mega Menu - Fixed Position */}
              <div
                className={`fixed inset-x-0 w-screen z-40 transition-all duration-200 ease-out ${
                  showMegaMenu
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
                style={{ top: headerHeight }}
              >
                <div className="bg-white shadow-lg border-t border-black/10">
                  <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="grid grid-cols-3 gap-6">
                      {categories.map((category) => (
                        <div key={category.id}>
                          <Link
                            href={`/collections/${category.slug}`}
                            className="block group"
                            onClick={() => setShowMegaMenu(false)}
                          >
                            <h3 className="text-sm font-semibold text-black/80 mb-1 group-hover:text-black transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-black/60 line-clamp-2">
                              {category.description}
                            </p>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/brands"
              className="text-sm font-normal text-black/70 hover:text-black transition-colors"
            >
              Brands
            </Link>

            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="text-sm font-normal text-black/70 hover:text-black transition-colors"
              >
                {collection.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden border-t border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <SearchBar />
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <nav className="flex flex-col space-y-4">
              {/* Categories Section */}
              <div className="space-y-2">
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Categories
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/collections/${category.slug}`}
                      className="block px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Brands Link */}
              <div className="space-y-2">
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Brands
                </div>
                <Link
                  href="/brands"
                  className="block px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  View All Brands
                </Link>
              </div>

              {/* Collections Section */}
              {collections.length > 0 && (
                <div className="space-y-2">
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Collections
                  </div>
                  <div className="space-y-1">
                    {collections.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.slug}`}
                        className="block px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
