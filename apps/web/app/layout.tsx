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
        {/* Loader + FOUC prevention — all inline, works before any CSS loads */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* FOUC prevention: body hidden until CSS + JS reveal it */
          body { visibility: hidden !important; }
          body.css-ready { visibility: visible !important; }

          /* Loader covers the entire viewport, visible by default */
          #rimoucha-loader {
            position: fixed; inset: 0; z-index: 99999;
            display: flex; align-items: center; justify-content: center; flex-direction: column;
            background: #fff0ed;
            visibility: visible !important;
            transition: opacity 0.35s ease;
            overflow: hidden;
          }
          #rimoucha-loader.fade-out {
            opacity: 0; pointer-events: none;
          }

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

        {/* Loader lifecycle — 3s min on landing, waits for CSS sentinel */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var shown = true, safetyTimer = null, pollId = null;
            var cssReady = false, minTimeReady = false;

            /* Is this the landing page (first visit)? */
            var isLanding = (location.pathname === '/' || location.pathname === '');
            var MIN_SHOW = isLanding ? 3000 : 0;

            function isCssLoaded() {
              try {
                return getComputedStyle(document.documentElement).getPropertyValue('--css-loaded').trim() === '1';
              } catch(e) { return false; }
            }

            function revealPage() {
              if (document.body) document.body.classList.add('css-ready');
            }

            function tryHide() {
              if (!cssReady || !minTimeReady) return;
              if (!shown) return;
              if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
              if (pollId) { clearInterval(pollId); pollId = null; }
              var el = document.getElementById('rimoucha-loader');
              if (el) el.classList.add('fade-out');
              shown = false;
              revealPage();
            }

            function hideLoader() {
              cssReady = true;
              minTimeReady = true;
              tryHide();
            }

            function showLoader() {
              var el = document.getElementById('rimoucha-loader');
              if (el) {
                el.classList.remove('fade-out');
                shown = true;
              }
            }

            /* Minimum display timer */
            setTimeout(function() {
              minTimeReady = true;
              tryHide();
            }, MIN_SHOW);

            /* Poll every 50ms: is globals.css applied yet? */
            function waitForCss() {
              if (isCssLoaded()) {
                cssReady = true;
                tryHide();
                return;
              }
              pollId = setInterval(function() {
                if (isCssLoaded()) {
                  cssReady = true;
                  if (pollId) { clearInterval(pollId); pollId = null; }
                  tryHide();
                }
              }, 50);
            }

            /* Start polling once body exists */
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', waitForCss);
            } else {
              waitForCss();
            }

            /* Safety: max 12s then force hide + reveal */
            safetyTimer = setTimeout(function() { hideLoader(); }, 12000);

            /* API for client-side route changes (useNavigating hook) */
            window.__rimouchaLoader = {
              start: function(customDelay) {
                if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
                if (pollId) { clearInterval(pollId); pollId = null; }
                cssReady = true; minTimeReady = false;
                shown = false;
                setTimeout(showLoader, typeof customDelay === 'number' ? customDelay : 1000);
                setTimeout(function() { minTimeReady = true; tryHide(); }, 800);
                safetyTimer = setTimeout(hideLoader, 6000);
              },
              stop: hideLoader,
              test: function() {
                shown = false;
                showLoader();
                if (safetyTimer) clearTimeout(safetyTimer);
                safetyTimer = setTimeout(hideLoader, 3000);
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
        suppressHydrationWarning
      >
        {/* Server-rendered loader — in the HTML from byte 0, visible instantly */}
        <div id="rimoucha-loader" aria-hidden="true" suppressHydrationWarning>
          <div className="loader-wave" style={{ fontFamily: 'var(--font-pacifico),Pacifico,cursive' }}>
            <span>R</span><span>i</span><span>m</span><span>o</span><span>u</span><span>c</span><span>h</span><span>a</span>
          </div>
          <div className="loader-dots">
            <span /><span /><span />
          </div>
          {/* Daisy flowers */}
          <div className="loader-daisy" style={{ top: '8%', left: '5%', animationDelay: '0s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ top: '15%', right: '8%', animationDelay: '0.6s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ bottom: '20%', left: '10%', animationDelay: '1.2s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ bottom: '10%', right: '6%', animationDelay: '0.4s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ top: '40%', left: '3%', animationDelay: '0.8s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ top: '35%', right: '4%', animationDelay: '1.6s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ bottom: '35%', left: '6%', animationDelay: '1s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
          <div className="loader-daisy" style={{ top: '12%', left: '40%', animationDelay: '1.8s' }}>
            <svg viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(0 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(72 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(144 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(216 18 18)" /><ellipse cx="18" cy="10" rx="4.5" ry="8" fill="#fff" opacity="0.9" transform="rotate(288 18 18)" /><circle cx="18" cy="18" r="4" fill="#ffcc00" /></svg>
          </div>
        </div>

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
