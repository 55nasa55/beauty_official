'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/providers';
import { checkAdminStatus } from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingBag,
  Tags,
  Grid,
  Star,
  LogOut,
  Menu,
  X,
  Image,
  Layout
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      const isAdmin = await checkAdminStatus(user.id);

      if (!isAdmin) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setIsLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Grid },
    { href: '/admin/dashboard/products', label: 'Products', icon: Package },
    { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
    { href: '/admin/dashboard/brands', label: 'Brands', icon: Star },
    { href: '/admin/dashboard/collections', label: 'Collections', icon: Grid },
    { href: '/admin/dashboard/banners', label: 'Banners', icon: Layout },
    { href: '/admin/dashboard/images', label: 'Images', icon: Image },
    { href: '/admin/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-light tracking-wider">Cosmetic Club</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-black font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-light tracking-wider">Cosmetic Club Admin</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="fixed top-16 left-0 right-0 bg-white p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-black font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Button
                variant="outline"
                className="w-full justify-start mt-4"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:p-8 p-4 mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
