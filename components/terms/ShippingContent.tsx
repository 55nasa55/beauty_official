import React from 'react';
import { Truck, Clock, RefreshCcw, CircleAlert as AlertCircle } from 'lucide-react';

const sectionStyle: React.CSSProperties = {
  marginBottom: '56px',
};

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '24px',
  fontWeight: 700,
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '2px solid var(--blush-pink)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const pStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--gray)',
  lineHeight: 1.9,
  marginBottom: '16px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '8px',
  fontSize: '14px',
};

const thStyle: React.CSSProperties = {
  background: 'var(--blush-pink)',
  color: 'var(--charcoal)',
  fontWeight: 700,
  padding: '12px 16px',
  textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--light-gray)',
  color: 'var(--charcoal)',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--coral)',
  fontWeight: 600,
};

export function ShippingContent() {
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
          Shipping &amp; Returns
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--charcoal)',
            opacity: 0.75,
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          Everything you need to know about getting your order and making it right if something&apos;s off.
        </p>
      </div>

      {/* Quick summary cards */}
      <div
        className="summary-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '900px',
          margin: '-36px auto 0',
          padding: '0 5% 64px',
        }}
      >
        <div
          className="summary-card"
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--light-gray)',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Truck size={28} style={{ color: 'var(--coral)', marginBottom: '12px' }} />
          <h3 className="font-heading" style={{ fontSize: '16px', marginBottom: '6px' }}>
            Free Shipping
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>
            Members over $55 · Non-members over $75. Flat $8.95 below threshold.
          </p>
        </div>
        <div
          className="summary-card"
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--light-gray)',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Clock size={28} style={{ color: 'var(--coral)', marginBottom: '12px' }} />
          <h3 className="font-heading" style={{ fontSize: '16px', marginBottom: '6px' }}>
            2–5 Business Days
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>
            Via USPS Ground Advantage or UPS Ground.
          </p>
        </div>
        <div
          className="summary-card"
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--light-gray)',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <RefreshCcw size={28} style={{ color: 'var(--coral)', marginBottom: '12px' }} />
          <h3 className="font-heading" style={{ fontSize: '16px', marginBottom: '6px' }}>
            30-Day Returns
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>
            Unopened products returned within 30 days for a full refund.
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className="content"
        style={{ maxWidth: '780px', margin: '0 auto', padding: '0 5% 80px' }}
      >
        {/* Shipping */}
        <div className="content-section" style={sectionStyle}>
          <h2 className="font-heading" style={h2Style}>
            <Truck size={22} style={{ color: 'var(--coral)' }} /> Shipping
          </h2>

          <div
            className="highlight-box"
            style={{
              background: '#f0f7ff',
              borderLeft: '4px solid var(--soft-rose)',
              borderRadius: '0 8px 8px 0',
              padding: '16px 20px',
              margin: '20px 0',
              fontSize: '14px',
              color: 'var(--charcoal)',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: 'var(--coral)' }}>
              Members get free shipping on orders over $55.
            </strong>{' '}
            Non-members get free shipping on orders over $75. Everyone pays a flat $8.95 S&amp;H below their threshold.
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Shipping Method</th>
                <th style={thStyle}>Estimated Delivery</th>
                <th style={thStyle}>Members</th>
                <th style={thStyle}>Non-Members</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>USPS Ground Advantage</td>
                <td style={tdStyle}>2–5 business days</td>
                <td style={tdStyle}>Free over $55 · $8.95 under</td>
                <td style={tdStyle}>Free over $75 · $8.95 under</td>
              </tr>
              <tr>
                <td style={tdStyle}>UPS Ground</td>
                <td style={tdStyle}>1–5 business days</td>
                <td style={tdStyle}>Free over $55 · $8.95 under</td>
                <td style={tdStyle}>Free over $75 · $8.95 under</td>
              </tr>
            </tbody>
          </table>

          <p style={{ ...pStyle, marginTop: '20px' }}>
            We do not offer expedited or overnight shipping. Orders are processed within 1–2 business days before shipping. You&apos;ll receive a confirmation email with a tracking number once your order is on the way.
          </p>

          <p style={pStyle}>
            We currently ship within the <strong style={{ color: 'var(--charcoal)' }}>United States only</strong>. International shipping is in progress — follow us or subscribe to our emails to be notified when it launches.
          </p>
        </div>

        {/* Returns */}
        <div className="content-section" style={sectionStyle}>
          <h2 className="font-heading" style={h2Style}>
            <RefreshCcw size={22} style={{ color: 'var(--coral)' }} /> Returns
          </h2>

          <p style={pStyle}>
            We want you to love what you ordered. Please review what&apos;s eligible for a return before reaching out.
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Item Type</th>
                <th style={thStyle}>Return Eligible?</th>
                <th style={thStyle}>Window</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>Unopened, unused products</td>
                <td style={tdStyle}>✅ Yes</td>
                <td style={tdStyle}>30 days from delivery</td>
              </tr>
              <tr>
                <td style={tdStyle}>Opened beauty products</td>
                <td style={tdStyle}>❌ No (hygiene)</td>
                <td style={tdStyle}>—</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>Skincare &amp; serums</td>
                <td style={tdStyle}>❌ No</td>
                <td style={tdStyle}>—</td>
              </tr>
              <tr>
                <td style={tdStyle}>Sale / clearance items</td>
                <td style={tdStyle}>❌ No</td>
                <td style={tdStyle}>—</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>Damaged or incorrect items</td>
                <td style={tdStyle}>✅ Yes</td>
                <td style={tdStyle}>7 days from delivery</td>
              </tr>
            </tbody>
          </table>

          <p style={{ ...pStyle, marginTop: '20px' }}>
            We do not offer exchanges. All sales on ineligible items are final.
          </p>

          <p style={{ ...pStyle, marginTop: '12px' }}>
            To start a return on an eligible item, email us at{' '}
            <a href="mailto:support@cosclub.com" style={linkStyle}>support@cosclub.com</a> with your order number and reason for return. We&apos;ll send a prepaid return label.
          </p>

          <p style={pStyle}>
            Refunds are processed within 5–7 business days of receiving and inspecting the returned item. Refunds are issued to the original payment method.
          </p>
        </div>

        {/* Damaged / Wrong Items */}
        <div className="content-section" style={sectionStyle}>
          <h2 className="font-heading" style={h2Style}>
            <AlertCircle size={22} style={{ color: 'var(--coral)' }} /> Damaged or Incorrect Orders
          </h2>
          <p style={pStyle}>
            If your order arrives damaged or contains the wrong items, please contact us within <strong style={{ color: 'var(--charcoal)' }}>7 days of delivery</strong> with a photo of the issue and your order number. We&apos;ll send a replacement or full refund — your choice.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Email us at{' '}
            <a href="mailto:support@cosclub.com" style={linkStyle}>support@cosclub.com</a> or visit our{' '}
            <a href="/contact" style={linkStyle}>Contact page</a>.
          </p>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .page-hero h1 { font-size: 28px !important; }
          .summary-strip { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
