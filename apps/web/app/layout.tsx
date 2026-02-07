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

        {/* ── Rimoucha Loading Screen CSS (inline for instant render) ── */}
        <style dangerouslySetInnerHTML={{ __html: `
          #rimoucha-loader {
            position: fixed; inset: 0; z-index: 99999;
            display: flex; align-items: center; justify-content: center; flex-direction: column;
            background: #fff0ed;
            opacity: 0; pointer-events: none;
            transition: opacity 0.35s ease;
            overflow: hidden;
          }
          #rimoucha-loader.visible { opacity: 1; pointer-events: auto; }
          #rimoucha-loader.fade-out { opacity: 0; pointer-events: none; }

          /* ── Wavy text ── */
          .loader-wave {
            display: flex; align-items: center; justify-content: center;
            position: relative; z-index: 2;
          }
          .loader-wave span {
            display: inline-block;
            font-size: clamp(2.4rem, 8vw, 4rem);
            color: #2dafaa;
            letter-spacing: 2px;
            animation: wave-bounce 1.4s ease-in-out infinite;
          }
          .loader-wave span:nth-child(1) { animation-delay: 0s; }
          .loader-wave span:nth-child(2) { animation-delay: 0.1s; }
          .loader-wave span:nth-child(3) { animation-delay: 0.2s; }
          .loader-wave span:nth-child(4) { animation-delay: 0.3s; }
          .loader-wave span:nth-child(5) { animation-delay: 0.4s; }
          .loader-wave span:nth-child(6) { animation-delay: 0.5s; }
          .loader-wave span:nth-child(7) { animation-delay: 0.6s; }
          .loader-wave span:nth-child(8) { animation-delay: 0.7s; }

          @keyframes wave-bounce {
            0%, 100% { transform: translateY(0); }
            30%      { transform: translateY(-18px); }
            60%      { transform: translateY(4px); }
          }

          /* ── Daisy flowers ── */
          .loader-daisy {
            position: absolute;
            width: 60px; height: 60px;
            opacity: 0;
            animation: daisy-pop 2.8s ease-in-out infinite;
          }
          .loader-daisy svg { width: 100%; height: 100%; }

          @keyframes daisy-pop {
            0%   { opacity: 0; transform: scale(0) rotate(-40deg); }
            12%  { opacity: 1; transform: scale(1.15) rotate(15deg); }
            22%  { opacity: 1; transform: scale(0.95) rotate(-5deg); }
            32%  { opacity: 1; transform: scale(1) rotate(0deg); }
            72%  { opacity: 1; transform: scale(1) rotate(8deg); }
            100% { opacity: 0; transform: scale(0.4) rotate(-60deg); }
          }

          /* Three breathing dots */
          .loader-dots {
            display: flex; gap: 8px; margin-top: 28px;
            position: relative; z-index: 2;
          }
          .loader-dots span {
            width: 6px; height: 6px; border-radius: 50%;
            background: #2dafaa; opacity: 0.25;
            animation: dot-breathe 1.6s ease-in-out infinite;
          }
          .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
          .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

          @keyframes dot-breathe {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50%      { opacity: 0.7;  transform: scale(1.2); }
          }
        `}} />

        {/* Loader logic — JS-created DOM (no hydration), proper lifecycle */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var loader = null, shown = false, timer = null, hideTimer = null;
            var pageReady = false;

            /* Delay: 500ms on landing page, 1000ms on other pages */
            var isLanding = (location.pathname === '/' || location.pathname === '');
            var DELAY = isLanding ? 500 : 1000;

            /* Daisy SVG — simple 5-petal flower */
            var daisySVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">'
              + '<ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)"/>'
              + '<ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)"/>'
              + '<ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)"/>'
              + '<ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)"/>'
              + '<ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)"/>'
              + '<circle cx="18" cy="18" r="4" fill="#ffcc00"/>'
              + '</svg>';

            /* Positions for daisies — spread around edges, avoid center */
            var daisyPositions = [
              {top:'8%',left:'5%',d:0}, {top:'15%',right:'8%',d:0.6},
              {bottom:'20%',left:'10%',d:1.2}, {bottom:'10%',right:'6%',d:0.4},
              {top:'40%',left:'3%',d:0.8}, {top:'35%',right:'4%',d:1.6},
              {bottom:'35%',left:'6%',d:1.0}, {top:'12%',left:'40%',d:1.8},
              {bottom:'8%',left:'35%',d:0.3}, {bottom:'8%',right:'30%',d:1.4},
              {top:'10%',right:'35%',d:2.0}
            ];

            function buildLoader() {
              var el = document.createElement('div');
              el.id = 'rimoucha-loader';
              el.setAttribute('aria-hidden', 'true');

              /* Wavy text — each letter is a separate span */
              var letters = 'Rimoucha'.split('');
              var waveDiv = document.createElement('div');
              waveDiv.className = 'loader-wave';
              waveDiv.style.fontFamily = 'var(--font-pacifico),Pacifico,cursive';
              for (var i = 0; i < letters.length; i++) {
                var s = document.createElement('span');
                s.textContent = letters[i];
                waveDiv.appendChild(s);
              }
              el.appendChild(waveDiv);

              /* Dots */
              var dots = document.createElement('div');
              dots.className = 'loader-dots';
              dots.innerHTML = '<span></span><span></span><span></span>';
              el.appendChild(dots);

              /* Daisy flowers */
              for (var j = 0; j < daisyPositions.length; j++) {
                var p = daisyPositions[j];
                var d = document.createElement('div');
                d.className = 'loader-daisy';
                d.innerHTML = daisySVG;
                if (p.top) d.style.top = p.top;
                if (p.bottom) d.style.bottom = p.bottom;
                if (p.left) d.style.left = p.left;
                if (p.right) d.style.right = p.right;
                d.style.animationDelay = (p.d || 0) + 's';
                el.appendChild(d);
              }

              return el;
            }

            function ensureLoader() {
              if (loader) return loader;
              if (!document.body) return null;
              loader = buildLoader();
              document.body.appendChild(loader);
              return loader;
            }

            function showLoader() {
              /* If page already finished loading, don't show */
              if (pageReady) { timer = null; return; }
              var el = ensureLoader();
              if (!el) {
                /* body not ready yet — retry in 10ms */
                timer = setTimeout(showLoader, 10);
                return;
              }
              el.classList.add('visible');
              el.classList.remove('fade-out');
              shown = true;
            }

            function hideLoader() {
              if (timer) { clearTimeout(timer); timer = null; }
              if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
              if (!shown) return;
              if (loader) {
                loader.classList.add('fade-out');
                loader.classList.remove('visible');
              }
              shown = false;
            }

            /* ── Initial page load ── */
            timer = setTimeout(showLoader, DELAY);

            /* Mark page ready — cancels any pending show */
            function onReady() {
              pageReady = true;
              hideLoader();
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', onReady);
            } else {
              onReady();
            }
            window.addEventListener('load', onReady);

            /* Safety: max 6s then force hide no matter what */
            hideTimer = setTimeout(function() { pageReady = true; hideLoader(); }, 6000);

            /* API for client-side route changes (useNavigating hook) */
            window.__rimouchaLoader = {
              start: function(customDelay) {
                pageReady = false;
                var d = typeof customDelay === 'number' ? customDelay : 1000;
                if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
                if (timer) { clearTimeout(timer); timer = null; }
                timer = setTimeout(showLoader, d);
                hideTimer = setTimeout(function() { pageReady = true; hideLoader(); }, 5000 + d);
              },
              stop: function() { pageReady = true; hideLoader(); },
              /* For testing: show loader for 3 seconds */
              test: function() {
                pageReady = false;
                if (timer) clearTimeout(timer);
                if (hideTimer) clearTimeout(hideTimer);
                showLoader();
                hideTimer = setTimeout(function() { pageReady = true; hideLoader(); }, 3000);
              }
            };
          })();
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
