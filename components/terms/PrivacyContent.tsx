'use client';

import React from 'react';

const toc = [
  { label: 'Information We Collect', id: 'information' },
  { label: 'How We Use It', id: 'how-we-use' },
  { label: 'Sharing', id: 'sharing' },
  { label: 'Marketing Emails', id: 'marketing' },
  { label: 'Cookies & Analytics', id: 'cookies' },
  { label: 'Data Retention', id: 'data-retention' },
  { label: 'Your Rights', id: 'your-rights' },
  { label: 'Security', id: 'security' },
  { label: 'Children', id: 'children' },
  { label: 'Changes', id: 'changes' },
  { label: 'Contact', id: 'contact' },
];

const sectionStyle: React.CSSProperties = {
  marginBottom: '48px',
  scrollMarginTop: '100px',
};

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '22px',
  fontWeight: 700,
  marginBottom: '16px',
  paddingBottom: '10px',
  borderBottom: '2px solid var(--blush-pink)',
};

const pStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--gray)',
  lineHeight: 1.9,
  marginBottom: '14px',
};

const ulStyle: React.CSSProperties = {
  margin: '12px 0 14px 20px',
  listStyle: 'disc',
};

const liStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--gray)',
  lineHeight: 1.9,
  marginBottom: '6px',
};

const strongStyle: React.CSSProperties = {
  color: 'var(--charcoal)',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--coral)',
  fontWeight: 600,
};

export function PrivacyContent() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--charcoal)', opacity: 0.65 }}>
          Last updated: July 15, 2026
        </p>
      </div>

      {/* Layout */}
      <div
        className="privacy-body"
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
        <div className="privacy-content">
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
            This Privacy Policy describes how CosClub (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares information about you when you use our website and services.
          </p>

          <section id="information" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>1. Information We Collect</h2>
            <p style={pStyle}>
              We collect information you provide directly to us, as well as information generated through your use of our services.
            </p>
            <p style={pStyle}>
              <strong style={strongStyle}>Information you provide:</strong>
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>
                <strong style={strongStyle}>Account information:</strong> Name, email address, and password when you create an account.
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Membership information:</strong> Billing details (processed securely via our payment provider), membership plan, and subscription status.
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Order information:</strong> Shipping address, order history, and payment method (we do not store full card numbers — these are handled by our payment processor).
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Communications:</strong> Messages you send us via our contact form or email, including support requests and product suggestions.
              </li>
            </ul>
            <p style={pStyle}>
              <strong style={strongStyle}>Information collected automatically:</strong>
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>Device type, browser, and operating system</li>
              <li style={liStyle}>Pages visited and time spent on our site</li>
              <li style={liStyle}>Referring URLs and general location (country/region level)</li>
            </ul>
          </section>

          <section id="how-we-use" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>2. How We Use Your Information</h2>
            <p style={pStyle}>We use the information we collect to:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>Create and manage your account and membership</li>
              <li style={liStyle}>Process and fulfill your orders</li>
              <li style={liStyle}>Send transactional emails (order confirmations, shipping updates, receipts)</li>
              <li style={liStyle}>Send marketing emails if you&apos;ve opted in (you can unsubscribe at any time)</li>
              <li style={liStyle}>Respond to your questions and support requests</li>
              <li style={liStyle}>Understand how our site is used and improve our product catalogue</li>
              <li style={liStyle}>Detect and prevent fraud or misuse of our membership</li>
            </ul>
            <p style={pStyle}>
              We use your data to run CosClub — not to build ad profiles or sell your attention to third parties.
            </p>
          </section>

          <section id="sharing" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>3. Sharing Your Information</h2>
            <p style={pStyle}>We do not sell your personal information. We share data only with:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>
                <strong style={strongStyle}>Payment processors</strong> (e.g., Stripe) to securely handle transactions
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Shipping carriers</strong> (e.g., USPS, UPS, FedEx) to deliver your orders
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Email service providers</strong> to send transactional and marketing emails on our behalf
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Analytics providers</strong> to understand site traffic and usage (in aggregate, non-identifying form)
              </li>
              <li style={liStyle}>
                <strong style={strongStyle}>Law enforcement or legal authorities</strong> if required by law or to protect our rights
              </li>
            </ul>
            <p style={pStyle}>
              All third-party providers we work with are contractually required to protect your data and use it only for the services they provide to us.
            </p>
          </section>

          <section id="marketing" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>4. Marketing Emails</h2>
            <p style={pStyle}>
              If you create an account or make a purchase, we may send you emails about new products, member-only promotions, and updates to our catalogue. You can unsubscribe from marketing emails at any time by clicking &quot;Unsubscribe&quot; at the bottom of any email or by updating your preferences in your{' '}
              <a href="/account" style={linkStyle}>account settings</a>.
            </p>
            <p style={pStyle}>
              We will always send you transactional emails (order confirmations, shipping updates) regardless of your marketing preferences, as these are necessary to fulfill your orders.
            </p>
          </section>

          <section id="cookies" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>5. Cookies &amp; Analytics</h2>
            <p style={pStyle}>
              We use cookies and similar tracking technologies to keep you logged in, remember your preferences (like items in your bag or wishlist), and understand how visitors use our site.
            </p>
            <p style={pStyle}>
              We use basic analytics tools to measure site traffic and performance. This data is collected in aggregate and is not tied to your personal identity. We do not use third-party advertising cookies or share your browsing data with advertisers.
            </p>
            <p style={pStyle}>
              You can disable cookies in your browser settings, though some features of our site may not function correctly without them.
            </p>
          </section>

          <section id="data-retention" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>6. Data Retention</h2>
            <p style={pStyle}>
              We retain your account and order information for as long as your account is active or as needed to provide services and comply with legal obligations (such as tax records). If you delete your account, we will remove your personal information within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          <section id="your-rights" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>7. Your Rights</h2>
            <p style={pStyle}>Depending on where you live, you may have the right to:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>Access the personal information we hold about you</li>
              <li style={liStyle}>Correct inaccurate information</li>
              <li style={liStyle}>Request deletion of your account and personal data</li>
              <li style={liStyle}>Opt out of marketing communications</li>
              <li style={liStyle}>Request a copy of your data in a portable format</li>
            </ul>
            <p style={pStyle}>
              To exercise any of these rights, email us at{' '}
              <a href="mailto:privacy@cosclub.com" style={linkStyle}>privacy@cosclub.com</a>. We&apos;ll respond within 30 days.
            </p>
          </section>

          <section id="security" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>8. Security</h2>
            <p style={pStyle}>
              We take reasonable technical and organizational measures to protect your information from unauthorized access, loss, or misuse. Payment information is handled by PCI-compliant payment processors and is never stored on our servers in full.
            </p>
            <p style={pStyle}>
              No method of transmission over the internet is 100% secure. If you believe your account has been compromised, please contact us immediately at{' '}
              <a href="mailto:support@cosclub.com" style={linkStyle}>support@cosclub.com</a>.
            </p>
          </section>

          <section id="children" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>9. Children&apos;s Privacy</h2>
            <p style={pStyle}>
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will delete it promptly. If you believe we have inadvertently collected such information, please contact us.
            </p>
          </section>

          <section id="changes" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>10. Changes to This Policy</h2>
            <p style={pStyle}>
              We may update this Privacy Policy from time to time. When we do, we&apos;ll revise the &quot;Last updated&quot; date at the top of this page. If we make material changes, we&apos;ll notify you by email or by a notice on our site before the changes take effect.
            </p>
            <p style={pStyle}>
              Your continued use of CosClub after any changes means you accept the updated policy.
            </p>
          </section>

          <section id="contact" style={sectionStyle}>
            <h2 className="font-heading" style={h2Style}>11. Contact Us</h2>
            <p style={pStyle}>
              If you have questions about this Privacy Policy or how we handle your data, reach out:
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>
                Email:{' '}
                <a href="mailto:privacy@cosclub.com" style={linkStyle}>privacy@cosclub.com</a>
              </li>
              <li style={liStyle}>
                Support:{' '}
                <a href="/contact" style={linkStyle}>cosclub.com/contact</a>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .privacy-body {
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
