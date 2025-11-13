'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Category, Brand, Collection } from '@/lib/database.types';
import { MiniCart } from './MiniCart';
import { SearchBar } from './SearchBar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface HeaderProps {
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
}

export function Header({ categories, brands, collections }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="text-2xl font-light tracking-wider">
            Good Looks
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center gap-8 flex-1 max-w-2xl mx-8">
            {showSearch ? (
              <SearchBar />
            ) : (
              <NavigationMenu>
                <NavigationMenuList className="flex items-center justify-center gap-2">
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-normal">
                      Categories
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[600px] grid-cols-2 gap-3 p-4 max-h-[500px] overflow-y-auto">
                        {categories.map((category) => (
                          <li key={category.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/collections/${category.slug}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50"
                              >
                                <div className="text-sm font-medium leading-none">
                                  {category.name}
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  {category.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link href="/brands" legacyBehavior passHref>
                      <NavigationMenuLink className="text-sm font-normal px-4 py-2 hover:text-gray-600 transition-colors">
                        Brands
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  {collections.length > 0 && (
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-sm font-normal">
                        Collections
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4">
                          {collections.map((collection) => (
                            <li key={collection.id}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={`/collections/${collection.slug}`}
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {collection.name}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>
            <MiniCart />
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <SearchBar />
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t py-4">
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
        )}
      </div>
    </header>
  );
}
