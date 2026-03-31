import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { CartProvider } from '@/lib/cart-context';
import { AddedToCartModal } from '@/components/cart/AddedToCartModal';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });
const playfairDisplay = Playfair_Display({ subsets: ['latin'] });

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
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600;700&display=swap');
          `
        }} />
      </head>
      <body className={inter.className}>
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
