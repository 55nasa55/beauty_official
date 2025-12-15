'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  brand_id: string;
  tags: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  compare_at_price: number;
  images: string[];
  specs: Record<string, any>;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface CategoryFacet {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface FacetOption {
  id: string;
  facet_id: string;
  label: string;
  value: string;
  sort_order: number;
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFacets, setCategoryFacets] = useState<CategoryFacet[]>([]);
  const [facetOptions, setFacetOptions] = useState<Record<string, FacetOption[]>>({});
  const [selectedFacetOptions, setSelectedFacetOptions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand_id: '',
    tags: '',
    is_featured: false,
    is_best_seller: false,
    is_new: false,
  });

  const [variantFormData, setVariantFormData] = useState({
    sku: '',
    name: '',
    price: '',
    compare_at_price: '',
    images: '',
    specs: '{}',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.category_id && isDialogOpen) {
      fetchFacetsForCategory(formData.category_id);
      if (!editingProduct) {
        setSelectedFacetOptions(new Set());
      }
    }
  }, [formData.category_id, isDialogOpen]);

  async function fetchData() {
    const [productsResult, categoriesResult, brandsResult] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
    ]);

    const productsData = productsResult.data || [];
    setProducts(productsData);
    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
    setIsLoading(false);

    if (productsData.length > 0) {
      fetchAllVariants(productsData.map((p: any) => p.id));
    }
  }

  async function fetchAllVariants(productIds: string[]) {
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .order('created_at');

    if (data) {
      const variantsByProduct: Record<string, ProductVariant[]> = {};
      (data as any[]).forEach((variant: any) => {
        if (!variantsByProduct[variant.product_id]) {
          variantsByProduct[variant.product_id] = [];
        }
        variantsByProduct[variant.product_id].push(variant);
      });
      setVariants(variantsByProduct);
    }
  }

  async function fetchVariants(productId: string) {
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at');

    if (data) {
      setVariants(prev => ({ ...prev, [productId]: data }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      is_featured: formData.is_featured,
      is_best_seller: formData.is_best_seller,
      is_new: formData.is_new,
    };

    try {
      let productId: string;

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);

        if (error) throw error;

        productId = editingProduct.id;

        await saveFacetOptions(productId);

        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        const { data, error } = await supabase.from('products').insert([productData]).select().single();

        if (error) throw error;

        productId = data.id;

        await saveFacetOptions(productId);

        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productId = selectedProductId || editingVariant?.product_id;

    if (!productId) {
      toast({
        title: 'Error',
        description: 'Product ID is missing',
        variant: 'destructive',
      });
      return;
    }

    let specs = {};
    try {
      specs = JSON.parse(variantFormData.specs);
    } catch {
      toast({
        title: 'Error',
        description: 'Invalid JSON in specs field',
        variant: 'destructive',
      });
      return;
    }

    const sku = variantFormData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    try {
      if (editingVariant) {
        const updateData = {
          product_id: productId,
          sku: sku,
          name: variantFormData.name,
          price: parseFloat(variantFormData.price),
          compare_at_price: parseFloat(variantFormData.compare_at_price) || 0,
          images: variantFormData.images ? variantFormData.images.split(',').map(s => s.trim()) : [],
          specs: specs,
        };

        const { error } = await (supabase as any)
          .from('product_variants')
          .update(updateData)
          .eq('id', editingVariant.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Variant updated successfully',
        });
      } else {
        const insertData = {
          product_id: productId,
          sku: sku,
          name: variantFormData.name,
          price: parseFloat(variantFormData.price),
          compare_at_price: parseFloat(variantFormData.compare_at_price) || 0,
          images: variantFormData.images ? variantFormData.images.split(',').map(s => s.trim()) : [],
          specs: specs,
        };

        const { error } = await (supabase as any)
          .from('product_variants')
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Variant created successfully',
        });
      }

      setIsVariantDialogOpen(false);
      resetVariantForm();

      await fetchVariants(productId);

      if (expandedProduct === productId) {
        setExpandedProduct(productId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      tags: product.tags?.join(', ') || '',
      is_featured: product.is_featured,
      is_best_seller: product.is_best_seller,
      is_new: product.is_new,
    });

    if (product.category_id) {
      await fetchFacetsForCategory(product.category_id);
      await loadProductFacetOptions(product.id);
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setSelectedProductId(variant.product_id);
    setVariantFormData({
      sku: variant.sku || '',
      name: variant.name,
      price: variant.price.toString(),
      compare_at_price: variant.compare_at_price?.toString() || '',
      images: variant.images?.join(', ') || '',
      specs: JSON.stringify(variant.specs || {}, null, 2),
    });
    setIsVariantDialogOpen(true);
  };

  const handleDeleteVariant = async (variantId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Variant deleted successfully',
      });

      fetchVariants(productId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddVariant = (productId: string) => {
    setSelectedProductId(productId);
    setEditingVariant(null);
    resetVariantForm();
    setIsVariantDialogOpen(true);
  };

  const toggleProductExpand = async (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      if (!variants[productId]) {
        await fetchVariants(productId);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category_id: '',
      brand_id: '',
      tags: '',
      is_featured: false,
      is_best_seller: false,
      is_new: false,
    });
    setEditingProduct(null);
    setCategoryFacets([]);
    setFacetOptions({});
    setSelectedFacetOptions(new Set());
  };

  const resetVariantForm = () => {
    setVariantFormData({
      sku: '',
      name: '',
      price: '',
      compare_at_price: '',
      images: '',
      specs: '{}',
    });
    setEditingVariant(null);
    setSelectedProductId(null);
  };

  const fetchFacetsForCategory = async (categoryId: string) => {
    if (!categoryId) {
      setCategoryFacets([]);
      setFacetOptions({});
      return;
    }

    try {
      const { data: facetsData, error: facetsError } = await supabase
        .from('category_facets')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order');

      if (facetsError) throw facetsError;

      setCategoryFacets(facetsData || []);

      if (facetsData && facetsData.length > 0) {
        const facetIds = facetsData.map(f => f.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from('facet_options')
          .select('*')
          .in('facet_id', facetIds)
          .order('sort_order');

        if (optionsError) throw optionsError;

        const optionsByFacet: Record<string, FacetOption[]> = {};
        (optionsData || []).forEach((option) => {
          if (!optionsByFacet[option.facet_id]) {
            optionsByFacet[option.facet_id] = [];
          }
          optionsByFacet[option.facet_id].push(option);
        });

        setFacetOptions(optionsByFacet);
      } else {
        setFacetOptions({});
      }
    } catch (error: any) {
      console.error('Error fetching facets:', error);
    }
  };

  const loadProductFacetOptions = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_facet_options')
        .select('facet_option_id')
        .eq('product_id', productId);

      if (error) throw error;

      const optionIds = new Set((data || []).map(item => item.facet_option_id));
      setSelectedFacetOptions(optionIds);
    } catch (error: any) {
      console.error('Error loading product facet options:', error);
    }
  };

  const saveFacetOptions = async (productId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('product_facet_options')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      if (selectedFacetOptions.size > 0) {
        const insertData = Array.from(selectedFacetOptions).map(optionId => ({
          product_id: productId,
          facet_option_id: optionId,
        }));

        const { error: insertError } = await supabase
          .from('product_facet_options')
          .insert(insertData);

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error saving facet options:', error);
      throw error;
    }
  };

  const toggleFacetOption = (optionId: string) => {
    const newSelected = new Set(selectedFacetOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedFacetOptions(newSelected);
  };

  const getFilteredProducts = () => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();

    return products.filter(product => {
      const productName = product.name.toLowerCase();
      const productSlug = product.slug.toLowerCase();

      const categoryName = categories
        .find(c => c.id === product.category_id)
        ?.name.toLowerCase() || '';

      const brandName = brands
        .find(b => b.id === product.brand_id)
        ?.name.toLowerCase() || '';

      const productVariants = variants[product.id] || [];
      const variantSkus = productVariants
        .map(v => v.sku?.toLowerCase() || '')
        .join(' ');

      const searchableText = `${productName} ${productSlug} ${categoryName} ${brandName} ${variantSkus}`;

      return searchableText.includes(query);
    });
  };

  const filteredProducts = getFilteredProducts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog and variations</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="featured, sale, new"
                />
              </div>

              {categoryFacets.length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">Product Attributes</Label>
                  {categoryFacets.map((facet) => (
                    <div key={facet.id} className="space-y-2">
                      <Label className="text-sm font-medium">{facet.name}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(facetOptions[facet.id] || []).map((option) => (
                          <label key={option.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedFacetOptions.has(option.id)}
                              onChange={() => toggleFacetOption(option.id)}
                              className="rounded"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {(facetOptions[facet.id] || []).length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No options available. Add options in the category facets settings.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isVariantDialogOpen} onOpenChange={(open) => {
        setIsVariantDialogOpen(open);
        if (!open) resetVariantForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Edit Variant' : 'Add New Variant'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleVariantSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU (auto-generated if blank)</Label>
                <Input
                  id="variant-sku"
                  value={variantFormData.sku}
                  onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                  placeholder="Leave blank for auto-generation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-name">Variant Name</Label>
                <Input
                  id="variant-name"
                  value={variantFormData.name}
                  onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                  required
                  placeholder="e.g., 100ml"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  value={variantFormData.price}
                  onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-compare-price">Compare At Price</Label>
                <Input
                  id="variant-compare-price"
                  type="number"
                  step="0.01"
                  value={variantFormData.compare_at_price}
                  onChange={(e) => setVariantFormData({ ...variantFormData, compare_at_price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant-images">Images (comma-separated URLs)</Label>
              <Textarea
                id="variant-images"
                value={variantFormData.images}
                onChange={(e) => setVariantFormData({ ...variantFormData, images: e.target.value })}
                rows={2}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant-specs">Specs (JSON format)</Label>
              <Textarea
                id="variant-specs"
                value={variantFormData.specs}
                onChange={(e) => setVariantFormData({ ...variantFormData, specs: e.target.value })}
                rows={4}
                placeholder='{"size": "100ml", "color": "Natural", "scent": "Unscented"}'
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingVariant ? 'Update Variant' : 'Add Variant'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsVariantDialogOpen(false);
                  resetVariantForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Products ({products.length})</CardTitle>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, category, brand, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products yet. Create your first product!</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No products found matching "{searchQuery}"</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.slug}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProductExpand(product.id)}
                      >
                        {expandedProduct === product.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedProduct === product.id && (
                    <div className="border-t p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Product Variants</h4>
                        <Button
                          size="sm"
                          onClick={() => handleAddVariant(product.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Variant
                        </Button>
                      </div>

                      {variants[product.id]?.length === 0 || !variants[product.id] ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No variants yet. Add a variant to get started.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {variants[product.id]?.map((variant) => (
                            <div key={variant.id} className="bg-white p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{variant.name}</span>
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                      {variant.sku || 'No SKU'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Price: ${variant.price.toFixed(2)}
                                    {variant.compare_at_price > 0 && (
                                      <span className="ml-2 line-through text-gray-400">
                                        ${variant.compare_at_price.toFixed(2)}
                                      </span>
                                    )}
                                  </p>
                                  {variant.images && variant.images.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {variant.images.length} image(s)
                                    </p>
                                  )}
                                  {variant.specs && Object.keys(variant.specs).length > 0 && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      {Object.entries(variant.specs).map(([key, value]) => (
                                        <span key={key} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                          {key}: {String(value)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditVariant(variant)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteVariant(variant.id, product.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
