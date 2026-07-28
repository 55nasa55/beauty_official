import Link from 'next/link';
import { Instagram, Twitter, Music2 } from 'lucide-react';
import { CosClubLogo } from './CosClubLogo';

export function Footer() {
  return (
    <footer className="bg-charcoal text-off-white" style={{ padding: '80px 5%' }}>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-[60px] max-w-[1400px] mx-auto">
        {/* Brand column */}
        <div>
          <div className="mb-6">
            <CosClubLogo height={40} />
          </div>
          <p className="text-footer-body">Curated beauty, at prices you deserve.</p>
          <div className="flex gap-4 mt-5">
            <a
              href="#"
              aria-label="Instagram"
              className="text-white hover:text-coral transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="text-white hover:text-coral transition-colors"
            >
              <Music2 className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-white hover:text-coral transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Shop column */}
        <div>
          <h3 className="text-footer-h3 mb-6">Shop</h3>
          <Link href="/collections/skincare" className="text-footer-body hover:text-blush-pink transition-colors">Skincare</Link>
          <Link href="/collections/makeup" className="text-footer-body hover:text-blush-pink transition-colors">Makeup</Link>
          <Link href="/collections/korean-beauty" className="text-footer-body hover:text-blush-pink transition-colors">K-Beauty</Link>
          <Link href="/collections/japanese-beauty" className="text-footer-body hover:text-blush-pink transition-colors">J-Beauty</Link>
          <Link href="/collections/sale" className="text-footer-body hover:text-blush-pink transition-colors" style={{ color: 'var(--coral)' }}>Sale</Link>
          <Link href="/browse" className="text-footer-body hover:text-blush-pink transition-colors">Shop All</Link>
        </div>

        {/* Help column */}
        <div>
          <h3 className="text-footer-h3 mb-6">Help</h3>
          <Link href="/faq" className="text-footer-body hover:text-blush-pink transition-colors">FAQ</Link>
          <Link href="/shipping-policy" className="text-footer-body hover:text-blush-pink transition-colors">Shipping &amp; Returns</Link>
          <Link href="/return-policy" className="text-footer-body hover:text-blush-pink transition-colors">Return Policy</Link>
          <Link href="/why-prices-are-lower" className="text-footer-body hover:text-blush-pink transition-colors">How Pricing Works</Link>
          <Link href="/contact" className="text-footer-body hover:text-blush-pink transition-colors">Contact Us</Link>
        </div>

        {/* Company column */}
        <div>
          <h3 className="text-footer-h3 mb-6">Company</h3>
          <Link href="/about" className="text-footer-body hover:text-blush-pink transition-colors">About Us</Link>
          <Link href="/terms-of-service" className="text-footer-body hover:text-blush-pink transition-colors">Terms of Service</Link>
          <Link href="/privacy-policy" className="text-footer-body hover:text-blush-pink transition-colors">Privacy Policy</Link>
          <Link href="/admin/login" className="text-footer-body hover:text-blush-pink transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
