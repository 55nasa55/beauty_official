'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VariantSelector } from '@/components/VariantSelector';
import {
  ProductWithVariants,
  Category,
  Brand,
  Collection,
  ProductVariant,
} from '@/lib/database.types';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [categoriesResult, brandsResult, collectionsResult, productResult] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('brands').select('*').order('name'),
          supabase
            .from('collections')
            .select('*')
            .eq('display_on_home', true)
            .order('sort_order'),
          supabase
            .from('products')
            .select('*, brand:brands(*), variants:product_variants(*)')
            .eq('slug', slug)
            .maybeSingle(),
        ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      const productData = productResult.data as ProductWithVariants | null;
      setProduct(productData);

      if (productData && productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      image: selectedVariant.images[0] || '',
    });

    toast({
      title: 'Added to cart',
      description: `${product.name} - ${selectedVariant.name}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />
      <Toaster />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={selectedVariant.images[selectedImageIndex] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {selectedVariant.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {selectedVariant.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 ${
                        selectedImageIndex === index ? 'ring-2 ring-black' : ''
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {product.brand && (
                <Link href={`/brand/${product.brand.slug}`}>
                  <p className="text-sm text-gray-500 uppercase tracking-wide hover:text-gray-900 transition-colors">
                    {product.brand.name}
                  </p>
                </Link>
              )}

              <div>
                <h1 className="text-3xl font-light tracking-wide mb-3">{product.name}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-medium">${selectedVariant.price.toFixed(2)}</p>
                  {selectedVariant.compare_at_price > 0 && (
                    <p className="text-lg text-gray-400 line-through">
                      ${selectedVariant.compare_at_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">{product.description}</p>

              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
              />

              <Button
                className="w-full h-12 text-base"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>

              {selectedVariant.specs && typeof selectedVariant.specs === 'object' && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-3">Product Details</h3>
                  <dl className="space-y-2">
                    {Object.entries(selectedVariant.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </dt>
                        <dd className="font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
