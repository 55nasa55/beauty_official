import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/lib/cart-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Good Looks - Premium Beauty & Skincare',
  description: 'Discover premium beauty and skincare products from top brands. Shop the latest in makeup, skincare, haircare, and wellness.',
  keywords: 'beauty, skincare, makeup, haircare, wellness, cosmetics, premium beauty products',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
