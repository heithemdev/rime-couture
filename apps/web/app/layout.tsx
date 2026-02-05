import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Pacifico, Work_Sans, M_PLUS_Rounded_1c } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtlLocale, type Locale } from '@/i18n/routing';
import { CartProvider } from '@/lib/cart-context';
import { LikesProvider } from '@/lib/likes-context';
import './globals.css';

// 1. Optimized Font Loading (Variable Fonts with preload)
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
  preload: true,
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  preload: true,
});

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
});

// Body font (Work Sans)
const workSans = Work_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
  preload: true,
});

// Heading font (M PLUS Rounded 1c)
const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mplus-rounded',
  display: 'swap',
  preload: true,
});

// 2. Metadata (SEO + Social)
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rymoucha.com'),
  title: {
    template: '%s | Rymoucha',
    default: 'Rymoucha - Premium Kids Clothing & Home Textiles',
  },
  description: 'Hand-sewn dresses for little girls and premium home textiles in Algeria.',
  keywords: ['kids clothing', 'dresses', 'home textiles', 'Algeria', 'handmade'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Rymoucha',
  },
};

// 3. Viewport (Mobile Optimization)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Parallel fetch for better performance
  const [locale, messages] = await Promise.all([getLocale() as Promise<Locale>, getMessages()]);

  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Prevent FOUC - hide until styles are ready */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { visibility: hidden; }
          html.styles-ready { visibility: visible; }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Show content immediately when DOM is ready (styles are inlined by Next.js)
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              document.documentElement.classList.add('styles-ready');
            });
          } else {
            document.documentElement.classList.add('styles-ready');
          }
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${workSans.variable} ${mPlusRounded.variable} font-sans antialiased min-h-screen flex flex-col`}
        style={{
          fontFamily: 'var(--font-work-sans), var(--font-family-body)',
        }}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider locale={locale}>
            <LikesProvider>
              {children}
            </LikesProvider>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
