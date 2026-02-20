import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import InventoryManagement from './InventoryManagement';

export const dynamic = 'force-dynamic';

async function getInventoryData() {
  const supabase = createSupabaseServerClient();

  // Check admin auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const email = session.user.email?.toLowerCase();
  if (!email) {
    redirect('/admin/login');
  }

  const { data: adminCheck } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!adminCheck) {
    redirect('/admin/login');
  }

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
  const inventoryData = variants?.map((variant: any) => ({
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

  return inventoryData;
}

export default async function InventoryPage() {
  const inventoryData = await getInventoryData();

  return <InventoryManagement initialData={inventoryData} />;
}
