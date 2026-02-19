'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

interface StockStatus {
  label: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
  className?: string;
}

function getStockStatus(
  stock: number,
  threshold: number,
  trackInventory: boolean
): StockStatus {
  if (!trackInventory) {
    return {
      label: 'Not tracked',
      variant: 'secondary',
    };
  }

  if (stock === 0) {
    return {
      label: 'Out of stock',
      variant: 'destructive',
    };
  }

  if (stock >= 1 && stock <= 4) {
    return {
      label: `Only ${stock} left`,
      variant: 'destructive',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    };
  }

  if (stock >= 5 && stock <= threshold) {
    return {
      label: 'Low stock',
      variant: 'outline',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
  }

  return {
    label: 'In stock',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-300',
  };
}

export default function InventoryManagement({
  initialData,
}: {
  initialData: InventoryItem[];
}) {
  const [data, setData] = useState<InventoryItem[]>(initialData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAdjustment, setBulkAdjustment] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const lowStockItems = useMemo(
    () =>
      data.filter(
        (item) =>
          item.track_inventory &&
          item.stock_quantity > 0 &&
          item.stock_quantity <= item.low_stock_threshold
      ),
    [data]
  );

  const outOfStockItems = useMemo(
    () => data.filter((item) => item.track_inventory && item.stock_quantity === 0),
    [data]
  );

  const sellingFastItems = useMemo(
    () =>
      [...data]
        .filter((item) => item.sold_last_30_days > 0)
        .sort((a, b) => b.sold_last_30_days - a.sold_last_30_days)
        .slice(0, 20),
    [data]
  );

  const handleSelectAll = (items: InventoryItem[], checked: boolean) => {
    const newSelected = new Set(selectedIds);
    items.forEach((item) => {
      if (checked) {
        newSelected.add(item.id);
      } else {
        newSelected.delete(item.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAdjustment = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one variant',
        variant: 'destructive',
      });
      return;
    }

    const adjustmentStr = bulkAdjustment.trim();
    if (!adjustmentStr) {
      toast({
        title: 'Error',
        description: 'Please enter an adjustment value',
        variant: 'destructive',
      });
      return;
    }

    const adjustment = parseInt(adjustmentStr, 10);
    if (isNaN(adjustment) || adjustment === 0) {
      toast({
        title: 'Error',
        description: 'Adjustment must be a non-zero integer',
        variant: 'destructive',
      });
      return;
    }

    setIsApplying(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        toast({
          title: 'Error',
          description: 'Session expired. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const selectedVariants = Array.from(selectedIds);
      const results = [];
      const errors = [];

      for (const variantId of selectedVariants) {
        try {
          const { data: newStock, error: rpcError } = await supabase.rpc(
            'adjust_variant_stock',
            {
              p_variant_id: variantId,
              p_adjustment: adjustment,
            }
          );

          if (rpcError) throw rpcError;

          await supabase.from('inventory_adjustments').insert({
            variant_id: variantId,
            change_amount: adjustment,
            reason: 'bulk_update',
            created_by: userId,
          });

          results.push({ variantId, newStock });
        } catch (error: any) {
          const variant = data.find((v) => v.id === variantId);
          errors.push({
            variantId,
            name: variant
              ? `${variant.product_name} - ${variant.variant_name}`
              : variantId,
            error: error.message,
          });
        }
      }

      // Refresh data
      const { data: updatedVariants } = await supabase
        .from('product_variants')
        .select('id, stock_quantity')
        .in('id', selectedVariants);

      if (updatedVariants) {
        setData((prevData) =>
          prevData.map((item) => {
            const updated = updatedVariants.find((v) => v.id === item.id);
            if (updated) {
              return { ...item, stock_quantity: updated.stock_quantity };
            }
            return item;
          })
        );
      }

      if (errors.length > 0) {
        toast({
          title: 'Partial Success',
          description: `Updated ${results.length} variants. ${errors.length} failed (likely would result in negative stock).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `Successfully adjusted stock for ${results.length} variants by ${adjustment > 0 ? '+' : ''}${adjustment}`,
        });
      }

      setSelectedIds(new Set());
      setBulkAdjustment('');
    } catch (error: any) {
      console.error('Error applying bulk adjustment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply bulk adjustment',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const renderTable = (items: InventoryItem[], showSelectAll = false) => {
    const allSelected =
      items.length > 0 && items.every((item) => selectedIds.has(item.id));
    const someSelected = items.some((item) => selectedIds.has(item.id));

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {showSelectAll && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      handleSelectAll(items, checked as boolean)
                    }
                    aria-label="Select all"
                  />
                )}
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Sold (30d)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const status = getStockStatus(
                  item.stock_quantity,
                  item.low_stock_threshold,
                  item.track_inventory
                );

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(item.id, checked as boolean)
                        }
                        aria-label={`Select ${item.product_name} - ${item.variant_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product_name}
                    </TableCell>
                    <TableCell>{item.variant_name}</TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.stock_quantity}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {item.low_stock_threshold}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {item.sold_last_30_days}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={status.variant}
                        className={status.className}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor stock levels and apply bulk adjustments
        </p>
      </div>

      {/* Bulk Adjustment Control */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Bulk Stock Adjustment
            </label>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter adjustment (e.g., +10 or -5)"
                value={bulkAdjustment}
                onChange={(e) => setBulkAdjustment(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={handleBulkAdjustment}
                disabled={isApplying || selectedIds.size === 0}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply to ${selectedIds.size} selected`
                )}
              </Button>
            </div>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <p className="text-sm text-gray-600 mt-3">
            {selectedIds.size} variant{selectedIds.size === 1 ? '' : 's'} selected
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({data.length})</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock ({lowStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="out-of-stock">
            Out of Stock ({outOfStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="selling-fast">
            Selling Fast ({sellingFastItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderTable(data, true)}
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          {renderTable(lowStockItems, true)}
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          {renderTable(outOfStockItems, true)}
        </TabsContent>

        <TabsContent value="selling-fast" className="space-y-4">
          {renderTable(sellingFastItems, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
