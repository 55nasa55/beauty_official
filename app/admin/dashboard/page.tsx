'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, Star, Tags } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    brands: 0,
    categories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [productsResult, ordersResult, brandsResult, categoriesResult] =
        await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('brands').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
        ]);

      setStats({
        products: productsResult.count || 0,
        orders: ordersResult.count || 0,
        brands: brandsResult.count || 0,
        categories: categoriesResult.count || 0,
      });

      setIsLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Products', value: stats.products, icon: Package, color: 'text-blue-600' },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-green-600' },
    { title: 'Brands', value: stats.brands, icon: Star, color: 'text-purple-600' },
    { title: 'Categories', value: stats.categories, icon: Tags, color: 'text-orange-600' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-wide mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Good Looks admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-600">Use the navigation menu to manage:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Products and their variants</li>
            <li>Categories for navigation</li>
            <li>Brands and their information</li>
            <li>Collections for dynamic carousels</li>
            <li>Orders and customer information</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
