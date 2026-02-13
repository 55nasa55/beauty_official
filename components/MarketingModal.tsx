'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { usePathname, useRouter } from 'next/navigation';
import { X, Package, TrendingDown, Users, Zap, Check } from 'lucide-react';

const STORAGE_KEY = 'cc_seen_marketing';

export function MarketingModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { user } = useAuth();
  const { isMember } = useMembership();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenModal = localStorage.getItem(STORAGE_KEY);
    const isAdmin = pathname?.startsWith('/admin');
    const shouldHide = (user && isMember) || isAdmin;

    if (!hasSeenModal && !shouldHide) {
      setTimeout(() => {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
      }, 500);
    }
  }, [user, isMember, pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 300);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto relative transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <button
          onClick={handleClose}
          className="sticky top-4 float-right mr-4 mt-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <div className="w-full px-6 py-16 space-y-24 clear-both">
        {/* SECTION 1 — Hero */}
        <section className="text-center space-y-6 pt-8">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-gray-900">
            Same beauty essentials.
            <br />
            <span className="font-medium">Lower prices — every time.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Cosmetic Club members save $1.50–$3 on every product. No sales to wait for, no coupon codes to hunt down.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              onClick={() => handleNavigate('/pricing')}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-lg font-medium"
            >
              Join Cosmetic Club
            </button>
            <button
              onClick={() => handleNavigate('/pricing')}
              className="px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
            >
              See How Pricing Works
            </button>
          </div>
        </section>

        {/* SECTION 2 — Price Comparison Cards */}
        <section className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="text-sm text-gray-500 line-through">Retail: $28</div>
              <div className="text-3xl font-semibold text-gray-900">$15.50</div>
              <div className="text-sm text-gray-700">Premium Korean Sunscreen</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="text-sm text-gray-500 line-through">Retail: $22</div>
              <div className="text-3xl font-semibold text-gray-900">$12.99</div>
              <div className="text-sm text-gray-700">Japanese Essence Toner</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="text-sm text-gray-500 line-through">Retail: $18</div>
              <div className="text-3xl font-semibold text-gray-900">$9.75</div>
              <div className="text-sm text-gray-700">Clean Beauty Serum</div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Why Our Prices Are Lower */}
        <section className="space-y-12">
          <div className="flex items-center gap-4">
            <div className="h-px bg-gray-300 flex-1"></div>
            <h2 className="text-3xl font-light text-gray-900">Why Our Prices Are Lower</h2>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Direct Sourcing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We work directly with brands and manufacturers, cutting out middlemen and markups.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Retail Markup</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Online-only means no expensive storefronts, and those savings go straight to you.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Member-First Model</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your membership covers our costs, so we pass product savings directly to you.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Smart Inventory</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We stock what you actually use, reducing waste and keeping prices consistently low.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Shop Essentials */}
        <section className="space-y-8 text-center">
          <div className="space-y-3">
            <h2 className="text-4xl font-light text-gray-900">Shop Essentials</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Curated collections of the best Korean, Japanese, and clean beauty products.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <button
              onClick={() => handleNavigate('/category/korean-skincare')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-colors"
            >
              Korean Skincare
            </button>
            <button
              onClick={() => handleNavigate('/category/sunscreen')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-colors"
            >
              Sunscreen
            </button>
            <button
              onClick={() => handleNavigate('/category/japanese-skincare')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-colors"
            >
              Japanese Skincare
            </button>
            <button
              onClick={() => handleNavigate('/category/makeup-basics')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-colors"
            >
              Makeup Basics
            </button>
            <button
              onClick={() => handleNavigate('/category/hair-care')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-colors"
            >
              Hair Care
            </button>
          </div>
        </section>

        {/* SECTION 5 — What You Need, When You Need It */}
        <section className="bg-gray-50 rounded-2xl p-12 space-y-8">
          <h2 className="text-3xl font-light text-gray-900 text-center">
            What You Need, When You Need It
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Everyday essentials</strong> like sunscreen, cleansers, and moisturizers at member prices
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Authentic products</strong> sourced directly from trusted Korean and Japanese brands
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Fast shipping</strong> so you never run out of your go-to products
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>No guesswork</strong> — clear pricing, honest reviews, and expert curation
              </p>
            </div>
          </div>
          <div className="text-center pt-4">
            <button
              onClick={() => handleNavigate('/pricing')}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-lg font-medium"
            >
              Start Saving Today
            </button>
          </div>
        </section>

        {/* SECTION 6 — Final Trust Section */}
        <section className="space-y-8 text-center pb-12">
          <h2 className="text-4xl font-light text-gray-900">
            Try Cosmetic Club Risk-Free
          </h2>
          <div className="max-w-xl mx-auto space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">Cancel anytime — no questions asked</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">Save on every order with member pricing</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
              <p className="text-gray-700">Join thousands of beauty enthusiasts saving daily</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button
              onClick={() => handleNavigate('/pricing')}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-lg font-medium"
            >
              Join Cosmetic Club
            </button>
            <button
              onClick={() => handleNavigate('/')}
              className="px-8 py-4 text-gray-600 hover:text-gray-900 transition-colors text-lg"
            >
              Browse as Guest
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
