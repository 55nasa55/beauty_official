'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import InventoryManagement from './InventoryManagement';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  sold_last_30_days: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    try {
      setIsLoading(true);

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Check admin by email
      const email = session.user.email?.toLowerCase();
      if (!email) {
        router.push('/admin/login');
        return;
      }

      const { data: adminCheck } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!adminCheck) {
        router.push('/admin/login');
        return;
      }

      setAuthChecked(true);

      // Load inventory data
      await loadInventoryData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInventoryData() {
    try {
      // Get cutoff date for 30-day sales
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString();

      // Fetch product variants with product info
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          name,
          sku,
          stock_quantity,
          low_stock_threshold,
          track_inventory,
          products!inner (
            id,
            name,
            archived
          )
        `)
        .eq('products.archived', false)
        .order('products.name')
        .order('name');

      if (variantsError) throw variantsError;

      // Fetch 30-day sales data
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select(`
          variant_id,
          quantity,
          orders!inner (
            created_at,
            status
          )
        `)
        .gte('orders.created_at', cutoffDate)
        .in('orders.status', ['pending', 'paid', 'shipped', 'delivered']);

      if (salesError) throw salesError;

      // Aggregate sales by variant
      const salesByVariant: Record<string, number> = {};
      salesData?.forEach((item: any) => {
        salesByVariant[item.variant_id] = (salesByVariant[item.variant_id] || 0) + item.quantity;
      });

      // Combine data
      const inventory = variants?.map((variant: any) => ({
        id: variant.id,
        product_id: variant.product_id,
        product_name: variant.products.name,
        variant_name: variant.name,
        sku: variant.sku,
        stock_quantity: variant.stock_quantity,
        low_stock_threshold: variant.low_stock_threshold,
        track_inventory: variant.track_inventory,
        sold_last_30_days: salesByVariant[variant.id] || 0,
      })) || [];

      setInventoryData(inventory);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }

  if (isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <InventoryManagement initialData={inventoryData} />;
}
