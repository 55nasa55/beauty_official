import Link from 'next/link';
import { Instagram, Twitter, Music2 } from 'lucide-react';
import { CosClubLogo } from './CosClubLogo';

const shopLinks = [
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'Makeup', href: '/collections/makeup' },
  { label: 'K-Beauty', href: '/collections/korean-beauty' },
  { label: 'J-Beauty', href: '/collections/japanese-beauty' },
  { label: 'Sale', href: '/collections/sale', sale: true },
  { label: 'Shop All', href: '/browse' },
];

const helpLinks = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping & Returns', href: '/shipping-policy' },
  { label: 'Contact Us', href: '/contact' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Membership Terms', href: '/terms-of-service' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

export function Footer() {
  return (
    <footer className="bg-charcoal text-off-white" style={{ padding: '48px 5%' }}>
      <div
        className="grid grid-cols-2 md:grid-cols-4 max-w-[1400px] mx-auto"
        style={{ gap: '28px 48px' }}
      >
        {/* CosClub column */}
        <div className="col-span-2 md:col-span-1 flex flex-col">
          <div className="mb-4">
            <CosClubLogo height={32} />
          </div>
          <p className="text-footer-body" style={{ lineHeight: 1.5, marginBottom: 16, fontSize: 13 }}>
            Curated beauty, at prices you deserve.
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="text-white hover:text-coral transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="text-white hover:text-coral transition-colors"
            >
              <Music2 className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-white hover:text-coral transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Shop column */}
        <div className="flex flex-col">
          <h3 className="text-footer-h3 mb-4" style={{ fontSize: 15 }}>Shop</h3>
          <nav className="flex flex-col gap-2.5">
            {shopLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-footer-body hover:text-blush-pink transition-colors"
                style={{ fontSize: 13, ...(item.sale ? { color: 'var(--coral)' } : {}) }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Help column */}
        <div className="flex flex-col">
          <h3 className="text-footer-h3 mb-4" style={{ fontSize: 15 }}>Help</h3>
          <nav className="flex flex-col gap-2.5">
            {helpLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-footer-body hover:text-blush-pink transition-colors"
                style={{ fontSize: 13 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Company column */}
        <div className="flex flex-col">
          <h3 className="text-footer-h3 mb-4" style={{ fontSize: 15 }}>Company</h3>
          <nav className="flex flex-col gap-2.5">
            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-footer-body hover:text-blush-pink transition-colors"
                style={{ fontSize: 13 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
