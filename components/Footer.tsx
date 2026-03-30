import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-light mb-4">Cosmetic Club</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Premium beauty and skincare products for everyone.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/collections/kbeauty" className="hover:text-gray-900 transition-colors">
                  Korean Beauty
                </Link>
              </li>
              <li>
                <Link href="/collections/suncare" className="hover:text-gray-900 transition-colors">
                  Suncare
                </Link>
              </li>
              <li>
                <Link href="/collections/jbeauty" className="hover:text-gray-900 transition-colors">
                  Japanese Beauty
                </Link>
              </li>
              <li>
                <Link href="/collections/hair" className="hover:text-gray-900 transition-colors">
                  Haircare
                </Link>
              </li>
              <li>
                <Link href="/browse" className="hover:text-gray-900 transition-colors">
                  Browse All
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-gray-900 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-gray-900 transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gray-900 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/why-prices-are-lower" className="hover:text-gray-900 transition-colors">
                  How Pricing Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-gray-900 transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Cosmetic Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
