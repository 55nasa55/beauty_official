'use client';

import React from 'react';

const toc = [
  { label: "What's Included", id: 'what-you-get' },
  { label: 'Billing & Payments', id: 'billing' },
  { label: 'Auto-Renewal', id: 'auto-renewal' },
  { label: 'Cancellation', id: 'cancellation' },
  { label: 'Refunds', id: 'refunds' },
  { label: 'Price Changes', id: 'price-changes' },
  { label: 'Pausing', id: 'pausing' },
  { label: 'Account & Access', id: 'account' },
  { label: 'Termination', id: 'termination' },
  { label: 'Changes to Terms', id: 'changes' },
  { label: 'Contact', id: 'contact' },
];

export function MembershipTermsContent() {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full">
      {/* Page Hero */}
      <div
        className="page-hero"
        style={{
          background: 'var(--blush-pink)',
          padding: '64px 5%',
          textAlign: 'center',
        }}
      >
        <h1
          className="font-heading"
          style={{ fontSize: '42px', fontWeight: 700, marginBottom: '12px' }}
        >
          Membership Terms
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--charcoal)', opacity: 0.65 }}>
          Last updated: July 22, 2026
        </p>
      </div>

      {/* Layout */}
      <div
        className="terms-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '60px',
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '64px 5% 80px',
        }}
      >
        {/* Table of Contents */}
        <nav className="toc" style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
          <h4
            className="font-heading"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--gray)',
              marginBottom: '16px',
            }}
          >
            Contents
          </h4>
          {toc.map((t) => (
            <button
              key={t.id}
              onClick={() => handleScroll(t.id)}
              className="toc-link"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--gray)',
                padding: '6px 0 6px 12px',
                borderLeft: '2px solid var(--light-gray)',
                transition: 'all 0.2s',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--coral)';
                e.currentTarget.style.borderLeftColor = 'var(--coral)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gray)';
                e.currentTarget.style.borderLeftColor = 'var(--light-gray)';
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="terms-content">
          <p
            className="effective-date"
            style={{
              fontSize: '13px',
              color: 'var(--gray)',
              marginBottom: '40px',
              padding: '12px 16px',
              background: '#f9f9f9',
              borderRadius: '8px',
              borderLeft: '3px solid var(--blush-pink)',
              lineHeight: 1.6,
            }}
          >
            These Membership Terms govern your CosClub membership subscription. By
            subscribing, you agree to these terms. For questions, contact us at{' '}
            <a
              href="mailto:hello@cosclub.com"
              style={{ color: 'var(--coral)', fontWeight: 600 }}
            >
              hello@cosclub.com
            </a>
            .
          </p>

          <section id="what-you-get" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              1. What&apos;s Included
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              An active CosClub membership gives you access to:
            </p>
            <ul style={{ margin: '12px 0 14px 20px', listStyle: 'disc' }}>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                <strong style={{ color: 'var(--charcoal)' }}>Member pricing</strong> — up to 40% off retail prices on all products we carry
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                <strong style={{ color: 'var(--charcoal)' }}>Free shipping</strong> on orders $55 or more (non-members qualify at $75+)
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                <strong style={{ color: 'var(--charcoal)' }}>Early access</strong> to new arrivals before they&apos;re available to the public
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                <strong style={{ color: 'var(--charcoal)' }}>Catalogue input</strong> — the ability to vote on and suggest products you&apos;d like us to stock
              </li>
            </ul>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Member benefits apply only while your subscription is active and in good standing. Benefits are non-transferable and apply to your account only.
            </p>
          </section>

          <section id="billing" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              2. Billing &amp; Payments
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Your membership is billed on a{' '}
              <strong style={{ color: 'var(--charcoal)' }}>monthly recurring basis</strong> at $6.99/month. Payment is processed via Stripe using the card on file at the time of sign-up.
            </p>
            <div
              className="highlight-box"
              style={{
                background: '#f9f9f9',
                borderRadius: '10px',
                padding: '20px 24px',
                marginBottom: '20px',
                borderLeft: '3px solid var(--soft-rose)',
              }}
            >
              <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: 0 }}>
                Your billing date is set to the day you first subscribed. For example, if you joined on July 5th, you&apos;ll be charged on the 5th of each subsequent month.
              </p>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              You&apos;re responsible for keeping your payment information up to date. If a payment fails, we&apos;ll retry up to three times over five days. If payment cannot be collected, your membership will be paused until the balance is resolved.
            </p>
          </section>

          <section id="auto-renewal" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              3. Auto-Renewal
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Your membership <strong style={{ color: 'var(--charcoal)' }}>renews automatically</strong> each month until you cancel. You&apos;ll receive a reminder email at least 3 days before each renewal charge. You can cancel at any time before your next billing date to avoid being charged for the following month.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              By subscribing, you authorize CosClub to charge your payment method on a recurring monthly basis until cancellation.
            </p>
          </section>

          <section id="cancellation" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              4. Cancellation
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              You can cancel your membership at any time — no questions asked, no cancellation fees.
            </p>
            <ul style={{ margin: '12px 0 14px 20px', listStyle: 'disc' }}>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Cancel anytime from your{' '}
                <a href="/account" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                  Account dashboard
                </a>{' '}
                under Membership, or by emailing{' '}
                <a href="mailto:hello@cosclub.com" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                  hello@cosclub.com
                </a>
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Cancellation takes effect at the end of your current billing period
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                You retain full member access and benefits until that date
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                After cancellation, your account reverts to a free guest account — you can still shop at retail prices
              </li>
            </ul>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We don&apos;t offer prorated refunds for partial months, but you won&apos;t be charged again after cancellation is confirmed.
            </p>
          </section>

          <section id="refunds" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              5. Refunds
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Membership fees are generally{' '}
              <strong style={{ color: 'var(--charcoal)' }}>non-refundable</strong>. However, we&apos;ll issue a full refund of your most recent charge if:
            </p>
            <ul style={{ margin: '12px 0 14px 20px', listStyle: 'disc' }}>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                You contact us within <strong style={{ color: 'var(--charcoal)' }}>48 hours</strong> of being charged and haven&apos;t used any member benefits during that billing period
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                A technical error on our end resulted in a duplicate or incorrect charge
              </li>
            </ul>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              To request a refund, email{' '}
              <a href="mailto:hello@cosclub.com" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                hello@cosclub.com
              </a>{' '}
              with your order or account details. Approved refunds are processed within 5–10 business days back to your original payment method.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Refunds for product orders (not membership fees) are covered separately in our{' '}
              <a href="/shipping-policy" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                Shipping &amp; Returns policy
              </a>
              .
            </p>
          </section>

          <section id="price-changes" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              6. Price Changes
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We reserve the right to change membership pricing at any time. If we raise the price of your subscription, we&apos;ll notify you by email at least{' '}
              <strong style={{ color: 'var(--charcoal)' }}>30 days in advance</strong> of the new rate taking effect.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              You can cancel before the new pricing kicks in if you don&apos;t wish to continue at the new rate. Continued use of the membership after the effective date constitutes acceptance of the new price.
            </p>
          </section>

          <section id="pausing" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              7. Pausing Your Membership
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We don&apos;t currently offer a formal pause feature. If you need a break, the best option is to cancel and re-subscribe when you&apos;re ready — your account history and wishlist are saved.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              If you&apos;re experiencing financial hardship or a special circumstance, reach out to us at{' '}
              <a href="mailto:hello@cosclub.com" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                hello@cosclub.com
              </a>{' '}
              and we&apos;ll do our best to help.
            </p>
          </section>

          <section id="account" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              8. Account &amp; Access
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Your membership is tied to the email address used at sign-up. You&apos;re responsible for keeping your account credentials secure and for all activity that occurs under your account.
            </p>
            <ul style={{ margin: '12px 0 14px 20px', listStyle: 'disc' }}>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Memberships are for individual use only and may not be shared
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                One membership per person
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Member pricing cannot be combined with other promotions unless explicitly stated
              </li>
            </ul>
          </section>

          <section id="termination" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              9. Termination by CosClub
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We reserve the right to suspend or terminate a membership if we determine, in our reasonable judgment, that an account has been used in violation of these terms — including but not limited to reselling member-priced products, fraudulent activity, or abusing our refund policy.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              In such cases, we&apos;ll notify you by email. If a termination is made in error, please contact us and we&apos;ll make it right.
            </p>
          </section>

          <section id="changes" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              10. Changes to These Terms
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We may update these Membership Terms from time to time. When we do, we&apos;ll update the &quot;Last updated&quot; date at the top of this page and notify active members by email for any material changes.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Continued use of your membership after changes take effect means you accept the updated terms.
            </p>
          </section>

          <section id="contact" style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
            <h2
              className="font-heading"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--blush-pink)',
              }}
            >
              11. Contact Us
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              Questions about your membership or these terms? We&apos;re happy to help.
            </p>
            <ul style={{ margin: '12px 0 14px 20px', listStyle: 'disc' }}>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Email:{' '}
                <a href="mailto:hello@cosclub.com" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                  hello@cosclub.com
                </a>
              </li>
              <li style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '6px' }}>
                Contact form:{' '}
                <a href="/contact" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                  Contact Us
                </a>
              </li>
            </ul>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.9, marginBottom: '14px' }}>
              We aim to respond to all membership inquiries within 1 business day.
            </p>
          </section>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .terms-body {
            grid-template-columns: 1fr !important;
          }
          .toc {
            display: none !important;
          }
          .page-hero h1 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
