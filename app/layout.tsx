import './globals.css';
import type { Metadata } from 'next';
import { Quicksand, Manrope } from 'next/font/google';
import { CartProvider } from '@/lib/cart-context';
import { AddedToCartModal } from '@/components/cart/AddedToCartModal';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cosmetic Club - Premium Beauty & Skincare',
  description: 'Discover premium beauty and skincare products from top brands. Shop the latest in makeup, skincare, haircare, and wellness.',
  keywords: 'beauty, skincare, makeup, haircare, wellness, cosmetics, premium beauty products',
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${quicksand.variable} ${manrope.variable}`}>
      <body className="font-manrope">
        <Providers>
          <CartProvider>
            {children}
            <AddedToCartModal />
            <Toaster />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
