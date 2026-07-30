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
import { ShoppingCart, Tag, Truck, CircleCheck as CheckCircle2, RefreshCw, Heart, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { formatCents, calculateSavingsFromCents } from '@/lib/pricing';
import { ReviewSummary } from '@/components/reviews/ReviewSummary';
import { ReviewList } from '@/components/reviews/ReviewList';
import { WriteReviewButton } from '@/components/reviews/WriteReviewButton';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { HoverZoom } from '@/components/product/HoverZoom';
import { ImageModal } from '@/components/product/ImageModal';

type TabKey = 'description' | 'ingredients' | 'howto';

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
  const [openReview, setOpenReview] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductWithVariants[]>([]);
  const [alsoBoughtProducts, setAlsoBoughtProducts] = useState<ProductWithVariants[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [wished, setWished] = useState(false);

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
        const [sectionsResult, suggestedResult] = await Promise.all([
          supabase
            .from('product_info_sections')
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
                .limit(5)
            : Promise.resolve({ data: null }),
        ]);

        setProductInfoSections(sectionsResult.data || []);
        setSuggestedProducts(suggestedResult.data || []);

        const res = await fetch(`/api/products/also-bought/${productData.id}`);
        const alsoBought = await res.json();
        setAlsoBoughtProducts(alsoBought || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  function getStockStatus(qty: number) {
    if (qty === 0) return { label: "Out of stock", color: "#dc2626" };
    if (qty <= 4) return { label: `Only ${qty} left`, color: "#dc2626" };
    if (qty <= 15) return { label: "Low stock", color: "#f97316" };
    return { label: "In stock", color: "#16a34a" };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--gray)' }}>Loading...</p>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--gray)' }}>Product not found</p>
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
        toast({ title: 'Error', description: 'Product variant not found.', variant: 'destructive' });
        return;
      }

      const variantStock = result.data as { stock_quantity: number; track_inventory: boolean };
      const existingItem = items.find(item => item.variantId === selectedVariant.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const requestedQuantity = currentQuantity + quantity;

      if (variantStock.track_inventory) {
        if (variantStock.stock_quantity === 0) {
          toast({ title: 'Out of Stock', description: 'This item is currently out of stock.', variant: 'destructive' });
          return;
        }
        if (requestedQuantity > variantStock.stock_quantity) {
          toast({ title: 'Limited Stock', description: `Only ${variantStock.stock_quantity} left in stock.`, variant: 'destructive' });
          return;
        }
      }

      const memberPrice = selectedVariant.member_price_cents ? selectedVariant.member_price_cents / 100 : null;

      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: selectedVariant.name,
        price: selectedVariant.price,
        memberPrice: memberPrice || undefined,
        image: selectedVariant.images[0] || '',
      });

      if (quantity > 1 || existingItem) {
        updateQuantity(selectedVariant.id, currentQuantity + quantity);
      }

      toast({ title: 'Added to cart', description: `${product.name} - ${selectedVariant.name}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add item to cart.', variant: 'destructive' });
    }
  };

  const memberPriceVal = selectedVariant.member_price_cents
    ? selectedVariant.member_price_cents / 100
    : null;
  const retailPrice = selectedVariant.price;
  const savings = memberPriceVal ? retailPrice - memberPriceVal : 0;
  const savingsPct = savings > 0 ? Math.round((savings / retailPrice) * 100) : 0;
  const isOutOfStock = selectedVariant.track_inventory && selectedVariant.stock_quantity <= 0;
  const stockStatus = selectedVariant.track_inventory
    ? getStockStatus(selectedVariant.stock_quantity)
    : null;

  const images = selectedVariant.images || [];
  const allRelatedProducts = [...suggestedProducts, ...alsoBoughtProducts].slice(0, 5);

  // Determine if product info sections should map to tabs
  const descriptionSection = productInfoSections.find(s => s.title.toLowerCase().includes('description')) || productInfoSections[0];
  const ingredientsSection = productInfoSections.find(s => s.title.toLowerCase().includes('ingredient'));
  const howToSection = productInfoSections.find(s =>
    s.title.toLowerCase().includes('how to') || s.title.toLowerCase().includes('use')
  );

  const tabs: { key: TabKey; label: string; content: any }[] = [];
  if (descriptionSection) {
    tabs.push({ key: 'description', label: 'Description', content: descriptionSection.content });
  } else if (product.description) {
    tabs.push({ key: 'description', label: 'Description', content: product.description });
  }
  if (ingredientsSection) {
    tabs.push({ key: 'ingredients', label: 'Ingredients', content: ingredientsSection.content });
  }
  if (howToSection) {
    tabs.push({ key: 'howto', label: 'How to Use', content: howToSection.content });
  }
  // Fallback: if we have multiple info sections, show them all as tabs
  if (tabs.length === 0 && productInfoSections.length > 0) {
    productInfoSections.forEach((s, i) => {
      tabs.push({
        key: `description` as TabKey,
        label: s.title,
        content: s.content,
      });
    });
  }

  function renderStars(rating: number) {
    return '★★★★★'.split('').map((s, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : 'var(--light-gray)' }}>{s}</span>
    ));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />
      <Toaster />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav
          className="breadcrumb"
          style={{
            padding: '16px 5%',
            fontSize: '13px',
            color: 'var(--gray)',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <Link href="/" style={{ color: 'var(--gray)' }}>Home</Link>
          <span style={{ color: 'var(--light-gray)' }}>/</span>
          <Link href="/browse" style={{ color: 'var(--gray)' }}>Shop</Link>
          {product.category && (
            <>
              <span style={{ color: 'var(--light-gray)' }}>/</span>
              <Link href={`/browse?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--gray)' }}>
                {product.category}
              </Link>
            </>
          )}
          <span style={{ color: 'var(--light-gray)' }}>/</span>
          <span style={{ color: 'var(--charcoal)' }}>{product.name}</span>
        </nav>

        {/* Product Layout */}
        <div
          className="product-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            padding: '0 5% 80px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Gallery */}
          <div className="gallery" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              className="main-img"
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#FAFAFA',
                border: '1px solid var(--light-gray)',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => {
                setModalImageIndex(selectedImageIndex);
                setShowImageModal(true);
              }}
            >
              <HoverZoom src={images[selectedImageIndex] || '/placeholder.jpg'} />
            </div>

            {images.length > 1 && (
              <div className="thumbnails" style={{ display: 'flex', gap: '10px' }}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="thumb"
                    onClick={() => setSelectedImageIndex(index)}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: `2px solid ${selectedImageIndex === index ? 'var(--coral)' : 'transparent'}`,
                      cursor: 'pointer',
                      background: '#FAFAFA',
                      flexShrink: 0,
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedImageIndex !== index) e.currentTarget.style.borderColor = 'var(--blush-pink)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImageIndex !== index) e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      width={72}
                      height={72}
                      className="object-cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info" style={{ paddingTop: '8px' }}>
            {product.brand && (
              <Link href={`/brand/${product.brand.slug}`}>
                <div
                  className="product-brand"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--gray)',
                    marginBottom: '8px',
                    transition: 'color 0.2s',
                  }}
                >
                  {product.brand.name}
                </div>
              </Link>
            )}

            <h1
              className="product-title font-heading"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: '12px',
              }}
            >
              {product.name}
            </h1>

            <div className="rating-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              {averageRating ? (
                <>
                  <span className="stars" style={{ color: '#f59e0b', fontSize: '16px' }}>
                    {renderStars(averageRating)}
                  </span>
                  <button
                    className="rating-count"
                    onClick={() => {
                      const el = document.getElementById('reviews');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      fontSize: '13px',
                      color: 'var(--coral)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    {reviewCount.toLocaleString()} review{reviewCount === 1 ? '' : 's'}
                  </button>
                </>
              ) : (
                <button
                  className="rating-count"
                  onClick={() => {
                    const el = document.getElementById('reviews');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    fontSize: '13px',
                    color: 'var(--coral)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  See all reviews
                </button>
              )}
            </div>

            {/* Pricing Card */}
            <div
              className="pricing-card"
              style={{
                background: '#f8fbff',
                border: '1px solid var(--blush-pink)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <div className="pricing-row" style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '14px' }}>
                <div className="price-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray)' }}>
                    Retail Price
                  </label>
                  <div className="retail-price" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gray)' }}>
                    ${retailPrice.toFixed(2)}
                  </div>
                </div>
                <div className="price-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray)' }}>
                    Member Price
                  </label>
                  <div className="member-price" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--coral)' }}>
                    {memberPriceVal ? `$${memberPriceVal.toFixed(2)}` : `$${retailPrice.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {savings > 0 && (
                <div
                  className="savings-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#fff0ed',
                    color: 'var(--coral)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: '1px solid #fdc5bb',
                  }}
                >
                  <Tag size={13} />
                  You save ${savings.toFixed(2)} ({savingsPct}%) with membership
                </div>
              )}

              {memberPriceVal && !membershipLoading && !isMember && (
                <div
                  className="member-note"
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--light-gray)',
                  }}
                >
                  Not a member?{' '}
                  <Link href="/pricing" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                    Join from $6.99/mo
                  </Link>{' '}
                  and save on every order.
                </div>
              )}

              {memberPriceVal && !membershipLoading && isMember && (
                <div
                  className="member-note"
                  style={{
                    fontSize: '12px',
                    color: '#2d6a2d',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--light-gray)',
                    fontWeight: 600,
                  }}
                >
                  You save ${savings.toFixed(2)} with your membership
                </div>
              )}
            </div>

            {/* Shipping Bar */}
            <div
              className="shipping-bar"
              style={{
                background: '#f0f9f0',
                border: '1px solid #bbdebb',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#2d6a2d',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <Truck size={16} />
              {isMember
                ? memberPriceVal
                  ? `Add $${Math.max(0, 55 - memberPriceVal).toFixed(2)} more to unlock free shipping (members over $55)`
                  : 'Free shipping on orders over $55 for members'
                : `Free shipping on orders over $75 (members over $55)`}
            </div>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <VariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={handleVariantChange}
                />
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="action-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              {/* Quantity selector */}
              <div
                className="qty-control"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid var(--light-gray)',
                  borderRadius: '8px',
                  height: '52px',
                }}
              >
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: '40px',
                    height: '100%',
                    border: 'none',
                    background: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'var(--charcoal)',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '48px',
                    height: '100%',
                    textAlign: 'center',
                    border: 'none',
                    borderLeft: '1px solid var(--light-gray)',
                    borderRight: '1px solid var(--light-gray)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--charcoal)',
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  style={{
                    width: '40px',
                    height: '100%',
                    border: 'none',
                    background: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'var(--charcoal)',
                  }}
                >
                  +
                </button>
              </div>

              <button
                className="btn-add-bag"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'var(--charcoal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  opacity: isOutOfStock ? 0.5 : 1,
                  height: '52px',
                }}
                onMouseEnter={(e) => { if (!isOutOfStock) e.currentTarget.style.background = '#1a1a1a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--charcoal)'; }}
              >
                <ShoppingCart size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
              </button>

              <button
                className={`btn-wish ${wished ? 'active' : ''}`}
                onClick={() => setWished(!wished)}
                aria-label="Add to wishlist"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '8px',
                  border: `1.5px solid ${wished ? 'var(--coral)' : 'var(--light-gray)'}`,
                  background: wished ? '#fff0ed' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: wished ? 'var(--coral)' : 'var(--gray)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Heart
                  size={20}
                  style={{ fill: wished ? 'var(--coral)' : 'none', stroke: wished ? 'var(--coral)' : 'currentColor', strokeWidth: 2 }}
                />
              </button>
            </div>

            {/* Stock Status */}
            {stockStatus && (
              <p style={{ fontSize: '13px', fontWeight: 600, color: stockStatus.color, marginBottom: '16px' }}>
                {stockStatus.label}
              </p>
            )}

            {/* Highlights */}
            <div
              className="highlights"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--light-gray)',
              }}
            >
              {product.description && (
                <div className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--charcoal)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                  {product.description}
                </div>
              )}
              {selectedVariant.specs && typeof selectedVariant.specs === 'object' &&
                Object.entries(selectedVariant.specs).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--charcoal)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                    {value ? `${key.replace(/_/g, ' ')}: ${String(value)}` : key.replace(/_/g, ' ')}
                  </div>
                ))
              }
              <div className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--charcoal)' }}>
                <RefreshCw size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                30-day return on unopened items ·{' '}
                <Link href="/shipping-policy" style={{ color: 'var(--coral)', fontWeight: 600 }}>Shipping info</Link>
              </div>
            </div>

            {/* Specs (if more than 4) */}
            {selectedVariant.specs && typeof selectedVariant.specs === 'object' &&
              Object.keys(selectedVariant.specs).length > 4 && (
              <div style={{ borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Product Details</h3>
                <dl style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(selectedVariant.specs).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <dt style={{ color: 'var(--gray)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</dt>
                      <dd style={{ fontWeight: 500 }}>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <>
            <div
              className="tabs"
              style={{
                marginTop: '60px',
                borderBottom: '2px solid var(--light-gray)',
                display: 'flex',
                gap: '0',
                padding: '0 5%',
                maxWidth: '1200px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key + tab.label}
                  onClick={() => setActiveTab(tab.key)}
                  className="tab-btn"
                  style={{
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: activeTab === tab.key ? 'var(--charcoal)' : 'var(--gray)',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--coral)' : 'transparent'}`,
                    marginBottom: '-2px',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="tab-content"
              style={{
                padding: '40px 5%',
                maxWidth: '1200px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1.9,
                  color: 'var(--charcoal)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {tabs.find(t => t.key === activeTab)?.content}
              </div>
            </div>
          </>
        )}

        {/* Reviews Section */}
        <div id="reviews" style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 className="font-heading" style={{ fontSize: '22px', fontWeight: 700 }}>Customer Reviews</h3>
            <WriteReviewButton
              productId={product.id}
              onOpen={() => setOpenReview(true)}
            />
          </div>

          <ReviewSummary productId={product.id} />

          <ReviewModal
            open={openReview}
            onClose={() => setOpenReview(false)}
            productId={product.id}
            variants={product.variants || []}
          />

          <ReviewList productId={product.id} />
        </div>

        {/* Related Products */}
        {allRelatedProducts.length > 0 && (
          <div
            className="related"
            style={{
              padding: '60px 5%',
              background: '#f8fbff',
            }}
          >
            <h2 className="font-heading" style={{ fontSize: '26px', fontWeight: 700, marginBottom: '28px' }}>
              You Might Also Like
            </h2>
            <div
              className="related-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '14px',
              }}
            >
              {allRelatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {showImageModal && (
        <ImageModal
          images={images}
          initialIndex={modalImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .product-layout {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .related-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
