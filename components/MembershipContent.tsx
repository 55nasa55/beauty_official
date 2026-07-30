'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, CircleCheck as CheckCircle2, ChevronDown, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { supabase } from '@/lib/supabase/client';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  billing_interval: string;
  amount_cents: number | null;
  is_active: boolean;
  sort_order: number;
}

interface Membership {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface MembershipContentProps {
  annualPlan: MembershipPlan | null;
}

const faqs = [
  {
    q: 'How does member pricing work?',
    a: "Every product in our catalogue has two prices — a retail price and a member price. When you join CosClub, you automatically see and pay the lower member price on every product, every time. No codes, no hoops. Just sign in and shop.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly members can cancel at any time and retain access through the end of their billing period. Annual plans are non-refundable — if you cancel, your membership remains active through the end of the paid year and will not auto-renew.',
  },
  {
    q: "What's the difference between Monthly and Annual?",
    a: "Both plans unlock the exact same member pricing and perks. The only difference is how you're billed. Annual members pay $59.99 upfront for the year — that works out to $5.00/mo and saves you $23.89 compared to paying monthly. Annual members also get priority customer support.",
  },
  {
    q: "What if a product I want isn't in the catalogue?",
    a: "Submit a request on our homepage — we take every suggestion seriously. We don't decide what goes on our shelves, you do. If enough members request the same product, we'll source it.",
  },
  {
    q: 'Is there a free trial?',
    a: "We don't offer a free trial, but at $6.99/mo the membership pays for itself on your first order. Most members save more in their first purchase than the cost of an entire year.",
  },
  {
    q: 'Can I switch between Monthly and Annual?',
    a: 'You can upgrade from Monthly to Annual at any time from your account page — the switch takes effect immediately. Annual plans are non-refundable; if you switch from Annual to Monthly, your monthly plan will begin at your next renewal date after the paid year ends.',
  },
];

export function MembershipContent({ annualPlan }: MembershipContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isMember, loading: membershipLoading } = useMembership();
  const [billingMode, setBillingMode] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (!user || membershipLoading || !isMember) return;
    const loadMembership = async () => {
      const { data } = await supabase
        .from('memberships')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setMembership(data as Membership);
    };
    loadMembership();
  }, [user, membershipLoading, isMember]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleJoinAnnual = async () => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    if (!membershipLoading && isMember) {
      router.push('/account');
      return;
    }
    if (!annualPlan) return;

    setCheckingOut(true);
    try {
      const response = await fetch('/api/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: annualPlan.stripe_price_id }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckingOut(false);
      }
    } catch {
      setCheckingOut(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/membership/portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // noop
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        'Are you sure you want to cancel your membership? You will retain access until the end of your billing period.'
      )
    ) {
      handleManageBilling();
    }
  };

  const monthlyFeatures = [
    'Up to 40% off retail prices on every product',
    'Free shipping on orders $35+',
    'Early access to new arrivals',
    'Members-only sale events',
    'Cancel anytime, no commitment',
  ];

  const annualFeatures = [
    'Up to 40% off retail prices on every product',
    'Free shipping on orders $35+',
    'Early access to new arrivals',
    'Members-only sale events',
    'Priority customer support',
  ];

  const renewalDate = membership?.current_period_end
    ? formatDate(membership.current_period_end)
    : '';

  return (
    <div className="w-full">
      {/* Hero */}
      <div
        className="hero"
        style={{
          background: 'linear-gradient(to bottom, var(--blush-pink), var(--off-white))',
          textAlign: 'center',
          padding: '80px 5% 60px',
        }}
      >
        <div
          className="hero-eyebrow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            border: '1.5px solid var(--blush-pink)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--soft-rose)',
            marginBottom: '24px',
          }}
        >
          <Tag size={14} /> Wholesale pricing for everyone
        </div>
        <h1
          className="font-heading"
          style={{ fontSize: '52px', lineHeight: 1.15, marginBottom: '20px' }}
        >
          Pay less for
          <br />
          the products you <span style={{ color: 'var(--soft-rose)' }}>love.</span>
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'var(--gray)',
            maxWidth: '520px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Anyone can shop CosClub — members just pay a lot less. Unlock wholesale
          pricing across our entire catalogue for $6.99/mo.
        </p>

        <div
          className="savings-strip"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            background: 'white',
            border: '1px solid var(--light-gray)',
            borderRadius: '16px',
            padding: '28px 40px',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          <div className="savings-item" style={{ textAlign: 'center' }}>
            <div
              className="font-heading"
              style={{ fontSize: '32px', fontWeight: 700, color: 'var(--coral)' }}
            >
              40%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>
              Max savings off retail
            </div>
          </div>
          <div
            className="savings-item"
            style={{
              textAlign: 'center',
              borderLeft: '1px solid var(--light-gray)',
              borderRight: '1px solid var(--light-gray)',
              padding: '0 40px',
            }}
          >
            <div
              className="font-heading"
              style={{ fontSize: '32px', fontWeight: 700, color: 'var(--coral)' }}
            >
              $42
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>
              Avg. member savings/month
            </div>
          </div>
          <div className="savings-item" style={{ textAlign: 'center' }}>
            <div
              className="font-heading"
              style={{ fontSize: '32px', fontWeight: 700, color: 'var(--coral)' }}
            >
              1 item
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>
              To break even on membership
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="billing-toggle-wrap" style={{ textAlign: 'center', padding: '48px 5% 0' }}>
        <p style={{ fontSize: '15px', color: 'var(--gray)', marginBottom: '16px' }}>
          Choose your billing cycle
        </p>
        <div
          className="billing-toggle"
          style={{
            display: 'inline-flex',
            background: '#f3f3f3',
            borderRadius: '30px',
            padding: '4px',
            gap: '4px',
          }}
        >
          <div
            className="toggle-option"
            onClick={() => setBillingMode('monthly')}
            style={{
              padding: '10px 24px',
              borderRadius: '26px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: billingMode === 'monthly' ? 'white' : 'var(--gray)',
              background: billingMode === 'monthly' ? 'var(--charcoal)' : 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Monthly
          </div>
          <div
            className="toggle-option"
            onClick={() => setBillingMode('annual')}
            style={{
              padding: '10px 24px',
              borderRadius: '26px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: billingMode === 'annual' ? 'white' : 'var(--gray)',
              background: billingMode === 'annual' ? 'var(--charcoal)' : 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Annual{' '}
            <span
              style={{
                background: 'var(--coral)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                marginLeft: '6px',
              }}
            >
              Save 28%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div
        className="pricing-section"
        style={{
          padding: '40px 5% 80px',
          display: 'flex',
          justifyContent: 'center',
          gap: '28px',
          flexWrap: 'wrap',
        }}
      >
        {/* Monthly Plan */}
        <div
          className="plan-card"
          style={{
            background: 'white',
            border: `2px solid ${
              billingMode === 'monthly' ? 'var(--soft-rose)' : 'var(--light-gray)'
            }`,
            borderRadius: '20px',
            padding: '40px 36px',
            width: '340px',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow:
              billingMode === 'monthly' ? '0 8px 32px rgba(122,175,216,0.2)' : 'none',
          }}
        >
          {isMember && membership?.status === 'active' && (
            <div
              className="current-tag"
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--coral)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 20px',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ Current Plan
            </div>
          )}
          <div
            className="plan-name"
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--gray)',
              marginBottom: '12px',
            }}
          >
            Monthly
          </div>
          <div
            className="plan-price"
            style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}
          >
            <span
              className="font-heading"
              style={{ fontSize: '52px', fontWeight: 700, lineHeight: 1 }}
            >
              $6.99
            </span>
            <span style={{ fontSize: '16px', color: 'var(--gray)', paddingBottom: '8px' }}>
              /mo
            </span>
          </div>
          <div
            style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '32px', minHeight: '20px' }}
          >
            Billed monthly · Cancel anytime
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '0 0 28px' }} />
          <ul
            className="plan-features"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {monthlyFeatures.map((feature, i) => (
              <li
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px', lineHeight: 1.5 }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--soft-rose)', flexShrink: 0, marginTop: '2px' }} />
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push('/account')}
            className="btn-join-plan"
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              background: 'var(--baby-blue)',
              color: 'var(--charcoal)',
            }}
          >
            Get Started
          </button>
          {isMember && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--light-gray)', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px', lineHeight: 1.6 }}>
                Manage your membership from your account
              </div>
              <button
                onClick={handleManageBilling}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white',
                  border: '1.5px solid var(--light-gray)',
                  color: 'var(--charcoal)',
                  marginBottom: '10px',
                }}
              >
                Update Payment Method
              </button>
              <button
                onClick={handleCancel}
                style={{ fontSize: '13px', color: 'var(--gray)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Cancel membership
              </button>
            </div>
          )}
        </div>

        {/* Annual Plan */}
        <div
          className="plan-card featured"
          style={{
            background: 'white',
            border: `2px solid ${
              billingMode === 'annual' || isMember ? 'var(--soft-rose)' : 'var(--light-gray)'
            }`,
            borderRadius: '20px',
            padding: '40px 36px',
            width: '340px',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow:
              billingMode === 'annual' ? '0 8px 32px rgba(122,175,216,0.2)' : 'none',
          }}
        >
          {!isMember && billingMode === 'annual' && (
            <div
              className="featured-tag"
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--soft-rose)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 20px',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Best Value
            </div>
          )}
          {isMember && (
            <div
              className="current-tag"
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--coral)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 20px',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ Current Plan
            </div>
          )}
          <div
            className="plan-name"
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--gray)',
              marginBottom: '12px',
            }}
          >
            Annual
          </div>
          <div
            className="plan-price"
            style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}
          >
            <span
              className="font-heading"
              style={{ fontSize: '52px', fontWeight: 700, lineHeight: 1 }}
            >
              $5.00
            </span>
            <span style={{ fontSize: '16px', color: 'var(--gray)', paddingBottom: '8px' }}>
              /mo
            </span>
          </div>
          <div
            style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '32px', minHeight: '20px' }}
          >
            Billed as <strong style={{ color: 'var(--coral)' }}>$59.99/yr</strong> · Save $23.89 vs
            monthly
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '0 0 28px' }} />
          <ul
            className="plan-features"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {annualFeatures.map((feature, i) => (
              <li
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px', lineHeight: 1.5 }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--soft-rose)', flexShrink: 0, marginTop: '2px' }} />
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={handleJoinAnnual}
            disabled={checkingOut || (!membershipLoading && isMember)}
            className="btn-join-plan featured-btn"
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              background: 'var(--soft-rose)',
              color: 'white',
              opacity: checkingOut || (!membershipLoading && isMember) ? 0.5 : 1,
            }}
          >
            {checkingOut
              ? 'Redirecting to checkout...'
              : !membershipLoading && isMember
              ? 'Current Plan'
              : user
              ? 'Get Started'
              : 'Log in to Join'}
          </button>
          {isMember && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--light-gray)', textAlign: 'center' }}>
              {renewalDate && (
                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px', lineHeight: 1.6 }}>
                  Next charge of <strong style={{ color: 'var(--charcoal)' }}>$59.99</strong> on{' '}
                  <strong style={{ color: 'var(--charcoal)' }}>{renewalDate}</strong>
                  <br />
                  Auto-renews annually
                </div>
              )}
              <button
                onClick={handleManageBilling}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white',
                  border: '1.5px solid var(--light-gray)',
                  color: 'var(--charcoal)',
                  marginBottom: '10px',
                }}
              >
                Update Payment Method
              </button>
              <button
                onClick={handleCancel}
                style={{ fontSize: '13px', color: 'var(--gray)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Cancel membership
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Savings Calculator */}
      <div
        className="calculator-section"
        style={{ background: 'var(--charcoal)', padding: '80px 5%', textAlign: 'center' }}
      >
        <h2 className="font-heading" style={{ fontSize: '38px', color: 'white', marginBottom: '12px' }}>
          See what you&apos;d actually save
        </h2>
        <p style={{ color: '#A0A0A0', fontSize: '16px', marginBottom: '48px' }}>
          Based on a typical member order of three bestselling products
        </p>

        <div
          className="calc-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            maxWidth: '860px',
            margin: '0 auto 40px',
          }}
        >
          {[
            { brand: 'COSRX', name: 'Advanced Snail 96 Mucin Power Essence', retail: '$25.00', member: '$14.50', save: 'Save $10.50' },
            { brand: 'Beauty of Joseon', name: 'Relief Sun: Rice + Probiotics SPF50+', retail: '$18.00', member: '$11.00', save: 'Save $7.00' },
            { brand: 'Medicube', name: 'Zero Pore Pad 2.0', retail: '$33.00', member: '$22.50', save: 'Save $10.50' },
          ].map((p, i) => (
            <div
              key={i}
              className="calc-product"
              style={{
                background: '#3a3a3a',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#A0A0A0', fontWeight: 700 }}>
                {p.brand}
              </div>
              <div style={{ fontSize: '14px', color: 'white', fontWeight: 600, lineHeight: 1.4 }}>
                {p.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ textDecoration: 'line-through', color: '#A0A0A0', fontSize: '14px' }}>
                  {p.retail}
                </span>
                <span style={{ color: 'var(--baby-blue)', fontSize: '18px', fontWeight: 700 }}>
                  {p.member}
                </span>
                <span
                  style={{
                    background: 'var(--coral)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {p.save}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="calc-result"
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px 40px',
            maxWidth: '500px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray)', fontWeight: 700, marginBottom: '6px' }}>
              Retail Total
            </div>
            <div className="font-heading" style={{ fontSize: '28px', fontWeight: 700 }}>
              $76.00
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>Without membership</div>
          </div>
          <div style={{ width: '1px', height: '50px', background: 'var(--light-gray)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray)', fontWeight: 700, marginBottom: '6px' }}>
              Member Total
            </div>
            <div className="font-heading" style={{ fontSize: '28px', fontWeight: 700 }}>
              $48.00
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>With CosClub</div>
          </div>
          <div style={{ width: '1px', height: '50px', background: 'var(--light-gray)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray)', fontWeight: 700, marginBottom: '6px' }}>
              You Save
            </div>
            <div className="font-heading" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--coral)' }}>
              $28.00
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              On one order alone
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section" style={{ padding: '80px 5%', maxWidth: '720px', margin: '0 auto' }}>
        <h2 className="font-heading" style={{ fontSize: '38px', textAlign: 'center', marginBottom: '48px' }}>
          Questions answered
        </h2>
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="faq-item"
            style={{ borderBottom: '1px solid var(--light-gray)' }}
          >
            <div
              className="faq-q"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '22px 0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {faq.q}
              <ChevronDown
                size={20}
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.3s',
                  color: 'var(--gray)',
                  transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </div>
            {openFaq === i && (
              <div style={{ paddingBottom: '20px', fontSize: '15px', color: 'var(--gray)', lineHeight: 1.8 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          .hero h1 { font-size: 36px !important; }
          .savings-strip { gap: 20px !important; padding: 20px !important; }
          .pricing-section { flex-direction: column !important; align-items: center !important; }
          .plan-card { width: 100% !important; max-width: 400px !important; }
          .calc-grid { grid-template-columns: 1fr !important; }
          .calc-result { flex-direction: column !important; }
          .calc-divider { width: 80% !important; height: 1px !important; }
        }
      `}</style>
    </div>
  );
}
