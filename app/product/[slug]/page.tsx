'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { supabasePublic } from '@/lib/supabase/public';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VariantSelector } from '@/components/VariantSelector';
import { ProductCard } from '@/components/ProductCard';
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
import { formatCents, calculateSavingsFromCents } from '@/lib/pricing';
import { ProductInfoAccordion } from '@/components/product/ProductInfoAccordion';
import { ProductInfoImages } from '@/components/product/ProductInfoImages';
import { ReviewSummary } from '@/components/reviews/ReviewSummary';
import { ReviewList } from '@/components/reviews/ReviewList';
import { WriteReviewButton } from '@/components/reviews/WriteReviewButton';
import { ReviewModal } from '@/components/reviews/ReviewModal';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem, updateQuantity, items } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMember, loading: membershipLoading } = useMembership();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productInfoSections, setProductInfoSections] = useState<any[]>([]);
  const [productInfoImages, setProductInfoImages] = useState<any[]>([]);
  const [openReview, setOpenReview] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductWithVariants[]>([]);
  const [alsoBoughtProducts, setAlsoBoughtProducts] = useState<ProductWithVariants[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

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
            .select('*, brand:brands(*), variants:product_variants(*), reviews(id, rating)')
            .eq('slug', slug)
            .eq('archived', false)
            .maybeSingle(),
        ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      const productData = productResult.data as ProductWithVariants | null;

      if (productData) {
        productData.tags = Array.isArray(productData.tags)
          ? productData.tags
          : typeof (productData.tags as any) === "string"
            ? (productData.tags as any).split(",").map((t: string) => t.trim()).filter(Boolean)
            : [];
      }

      setProduct(productData);

      // Compute average rating
      const ratings = (productData as any)?.reviews?.map((r: any) => r.rating) || [];
      const avgRating = ratings.length
        ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length)
        : null;
      setAverageRating(avgRating);
      setReviewCount(ratings.length);

      if (productData && productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      if (productData) {
        const [sectionsResult, imagesResult, suggestedResult] = await Promise.all([
          supabase
            .from('product_info_sections')
            .select('*')
            .eq('product_id', productData.id)
            .order('order_index'),
          supabase
            .from('product_info_images')
            .select('*')
            .eq('product_id', productData.id)
            .order('order_index'),
          productData.brand_id
            ? supabasePublic
                .from('products')
                .select('*, brand:brands(*), variants:product_variants(*)')
                .eq('brand_id', productData.brand_id)
                .eq('archived', false)
                .neq('id', productData.id)
                .order('created_at', { ascending: false })
                .limit(4)
            : Promise.resolve({ data: null }),
        ]);

        setProductInfoSections(sectionsResult.data || []);
        setProductInfoImages(imagesResult.data || []);
        setSuggestedProducts(suggestedResult.data || []);

        // Fetch "Customers Also Bought" products
        const res = await fetch(`/api/products/also-bought/${productData.id}`);
        const alsoBought = await res.json();
        setAlsoBoughtProducts(alsoBought || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  function getStockStatus(qty: number) {
    if (qty === 0) return { label: "Out of stock", color: "text-red-600" };
    if (qty <= 4) return { label: `Only ${qty} left`, color: "text-red-600" };
    if (qty <= 15) return { label: "Low stock", color: "text-orange-500" };
    return { label: "In stock", color: "text-green-600" };
  }

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

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    try {
      const result = await supabasePublic
        .from('product_variants')
        .select('stock_quantity, track_inventory')
        .eq('id', selectedVariant.id)
        .maybeSingle();

      if (result.error || !result.data) {
        toast({
          title: 'Error',
          description: 'Product variant not found.',
          variant: 'destructive',
        });
        return;
      }

      const variantStock = result.data as { stock_quantity: number; track_inventory: boolean };
      const existingItem = items.find(item => item.variantId === selectedVariant.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const requestedQuantity = currentQuantity + quantity;

      if (variantStock.track_inventory) {
        if (variantStock.stock_quantity === 0) {
          toast({
            title: 'Out of Stock',
            description: 'This item is currently out of stock.',
            variant: 'destructive',
          });
          return;
        }

        if (requestedQuantity > variantStock.stock_quantity) {
          toast({
            title: 'Limited Stock',
            description: `Only ${variantStock.stock_quantity} left in stock.`,
            variant: 'destructive',
          });
          return;
        }
      }

      const memberPrice = selectedVariant.member_price_cents ? selectedVariant.member_price_cents / 100 : null;
      const finalPrice = !membershipLoading && isMember && memberPrice ? memberPrice : selectedVariant.price;

      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: selectedVariant.name,
        price: finalPrice,
        image: selectedVariant.images[0] || '',
      });

      if (quantity > 1 || existingItem) {
        updateQuantity(selectedVariant.id, currentQuantity + quantity);
      }

      toast({
        title: 'Added to cart',
        description: `${product.name} - ${selectedVariant.name}`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart.',
        variant: 'destructive',
      });
    }
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
                <div className="flex items-center gap-2 mb-3">
                  {averageRating ? (
                    <>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                        <span>⭐</span>
                        <span>{averageRating.toFixed(1)}</span>
                        <span className="text-gray-500">/ 5</span>
                      </div>
                      <button
                        onClick={() => {
                          const el = document.getElementById("reviews-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-sm underline cursor-pointer text-gray-600 hover:text-gray-900"
                      >
                        See all {reviewCount} reviews
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        const el = document.getElementById("reviews-section");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-sm underline cursor-pointer text-gray-600 hover:text-gray-900"
                    >
                      See all reviews
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!membershipLoading && isMember && selectedVariant.member_price_cents ? (
                    <>
                      <p className="text-2xl font-medium text-blue-600">
                        {formatCents(selectedVariant.member_price_cents)}
                      </p>
                      <p className="text-lg text-gray-400 line-through">
                        ${selectedVariant.price.toFixed(2)}
                      </p>
                      <span className="text-sm text-green-600 font-medium">
                        Member
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-medium">${selectedVariant.price.toFixed(2)}</p>
                      {selectedVariant.compare_at_price > 0 && (
                        <p className="text-lg text-gray-400 line-through">
                          ${selectedVariant.compare_at_price.toFixed(2)}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {selectedVariant.member_price_cents && !membershipLoading && !isMember && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-medium text-blue-700">
                        Member Price: {formatCents(selectedVariant.member_price_cents)}
                      </p>
                      <span className="text-sm text-blue-600">
                        (Save {formatCents(calculateSavingsFromCents(Math.round(selectedVariant.price * 100), selectedVariant.member_price_cents))})
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {!user ? (
                        <>
                          <Link href={`/login?redirect=${encodeURIComponent(`/product/${slug}`)}`}>
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                              Log in
                            </Button>
                          </Link>
                          <Link href="/pricing">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Join Now
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Link href="/pricing">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Join Now to Save
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
                {!membershipLoading && isMember && selectedVariant.member_price_cents && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700 font-medium">
                      You saved {formatCents(calculateSavingsFromCents(Math.round(selectedVariant.price * 100), selectedVariant.member_price_cents))} with your membership
                    </p>
                  </div>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">{product.description}</p>

              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
              />

              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600">Quantity:</label>

                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-1 text-lg"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-12 text-center border-l border-r"
                  />

                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3 py-1 text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              {selectedVariant?.track_inventory && (
                <p className={`text-sm font-medium mt-1 ${getStockStatus(selectedVariant.stock_quantity).color}`}>
                  {getStockStatus(selectedVariant.stock_quantity).label}
                </p>
              )}

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

          <ProductInfoAccordion sections={productInfoSections} />
          <ProductInfoImages images={productInfoImages} />

          {/* -------------------- REVIEWS SECTION -------------------- */}
          <div id="reviews-section" className="mt-16">
            <ReviewSummary productId={product.id} />
            <WriteReviewButton
              productId={product.id}
              onOpen={() => setOpenReview(true)}
            />
            <ReviewModal
              open={openReview}
              onClose={() => setOpenReview(false)}
              productId={product.id}
              variants={product.variants || []}
            />
            <ReviewList productId={product.id} />
          </div>

          {/* -------------------- SUGGESTED PRODUCTS SECTION -------------------- */}
          {suggestedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-light mb-6">You May Also Like</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {suggestedProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}

          {/* -------------------- CUSTOMERS ALSO BOUGHT SECTION -------------------- */}
          {alsoBoughtProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-light mb-6">Frequently Bought Together</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {alsoBoughtProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
