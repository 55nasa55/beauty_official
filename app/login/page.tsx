'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Category, Brand, Collection } from '@/lib/database.types';
import {
  Sparkles,
  Tag,
  Package,
  Calendar,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const getRedirectUrl = () => {
    const redirect = searchParams.get('redirect');
    return redirect?.startsWith('/') ? redirect : '/account';
  };

  useEffect(() => {
    loadHeaderData();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.push(getRedirectUrl());
    }
  }, [user, authLoading, router]);

  async function loadHeaderData() {
    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('collections').select('*').order('sort_order'),
    ]);
    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
    setCollections(collectionsResult.data || []);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const signupHref = searchParams.get('redirect')
    ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
    : '/signup';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header categories={categories} brands={brands} collections={collections} />

      {/* Guest View — Login + Join Split */}
      <div className="flex flex-col md:flex-row flex-1" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Login Side */}
        <div
          className="login-side flex flex-col justify-center"
          style={{
            flex: 1,
            padding: '80px 60px',
            borderRight: '1px solid var(--light-gray)',
          }}
        >
          <h2 className="font-heading" style={{ fontSize: '32px', marginBottom: '8px' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--gray)', marginBottom: '40px', fontSize: '15px' }}>
            Sign in to access your member pricing and order history.
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="form-group flex flex-col" style={{ gap: '8px', marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  padding: '14px 16px',
                  border: '1.5px solid var(--light-gray)',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: 'var(--charcoal)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blush-pink)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--light-gray)')}
              />
            </div>

            {/* Password */}
            <div className="form-group flex flex-col" style={{ gap: '8px', marginBottom: '20px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    padding: '14px 16px',
                    border: '1.5px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: 'var(--charcoal)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    width: '100%',
                    paddingRight: '44px',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blush-pink)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--light-gray)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Forgot password */}
            <Link
              href="/forgot-password"
              className="forgot"
              style={{
                fontSize: '13px',
                color: 'var(--gray)',
                marginBottom: '28px',
                display: 'block',
              }}
            >
              Forgot your password?
            </Link>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-login"
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--baby-blue)',
                color: 'var(--charcoal)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '16px',
                fontFamily: 'var(--font-manrope), var(--body-font)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider flex items-center" style={{ gap: '12px', margin: '24px 0', color: 'var(--gray)', fontSize: '13px' }}>
            <span style={{ flex: 1, height: '1px', background: 'var(--light-gray)' }} />
            or
            <span style={{ flex: 1, height: '1px', background: 'var(--light-gray)' }} />
          </div>

          {/* Don't have an account */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href={signupHref}
              style={{ color: 'var(--coral)', fontWeight: 700 }}
            >
              Join CosClub →
            </Link>
          </p>
        </div>

        {/* Join Side */}
        <div
          className="join-side flex flex-col justify-center items-center"
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, var(--blush-pink), var(--soft-rose))',
            padding: '80px 60px',
            textAlign: 'center',
          }}
        >
          <Sparkles size={40} style={{ color: 'var(--charcoal)', marginBottom: '24px', opacity: 0.7 }} />
          <h2 className="font-heading" style={{ fontSize: '36px', marginBottom: '16px' }}>
            Join CosClub
          </h2>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'var(--charcoal)',
              opacity: 0.85,
              marginBottom: '36px',
              maxWidth: '340px',
            }}
          >
            You can shop without a membership at retail prices — or join CosClub and unlock wholesale
            pricing on everything we carry.
          </p>

          <ul className="perks-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', textAlign: 'left', width: '100%', maxWidth: '320px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
              <Tag size={20} style={{ color: 'var(--charcoal)', width: '20px', flexShrink: 0 }} />
              Up to 40% off retail prices
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
              <Package size={20} style={{ color: 'var(--charcoal)', width: '20px', flexShrink: 0 }} />
              Free shipping on orders $55+
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
              <Calendar size={20} style={{ color: 'var(--charcoal)', width: '20px', flexShrink: 0 }} />
              Early access to new arrivals
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600, marginBottom: 0 }}>
              <Users size={20} style={{ color: 'var(--charcoal)', width: '20px', flexShrink: 0 }} />
              Help shape our catalogue
            </li>
          </ul>

          <Link
            href="/pricing"
            className="btn-join-big"
            style={{
              width: '100%',
              maxWidth: '320px',
              padding: '18px',
              background: 'var(--charcoal)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '18px',
              fontFamily: 'var(--font-manrope), var(--body-font)',
              display: 'block',
              textAlign: 'center',
              transition: 'background 0.2s',
            }}
          >
            Join for $6.99/mo
          </Link>
          <p style={{ fontSize: '12px', color: 'var(--charcoal)', opacity: 0.6, marginTop: '12px' }}>
            Cancel anytime · No commitment · Instant access
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
