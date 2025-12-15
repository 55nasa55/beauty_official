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
                <Link href="/category/skincare" className="hover:text-gray-900 transition-colors">
                  Skincare
                </Link>
              </li>
              <li>
                <Link href="/category/makeup" className="hover:text-gray-900 transition-colors">
                  Makeup
                </Link>
              </li>
              <li>
                <Link href="/category/hair" className="hover:text-gray-900 transition-colors">
                  Hair
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-gray-900 transition-colors">
                  All Brands
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900 transition-colors">
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
