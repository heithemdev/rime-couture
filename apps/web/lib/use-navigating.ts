// apps/web/lib/use-navigating.ts
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useTransition } from 'react';

declare global {
  interface Window {
    __rimouchaLoader?: {
      start: (customDelay?: number) => void;
      stop: () => void;
    };
  }
}

/**
 * Wraps Next.js useRouter with Rimoucha loader integration.
 * Shows the loading screen after 1s for client-side navigations,
 * hides it the instant the route finishes rendering.
 */
export function useNavigating() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const wasNavigating = useRef(false);

  useEffect(() => {
    if (wasNavigating.current && !isNavigating) {
      window.__rimouchaLoader?.stop();
    }
    wasNavigating.current = isNavigating;
  }, [isNavigating]);

  const push = useCallback(
    (href: string) => {
      window.__rimouchaLoader?.start(1000);
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startTransition],
  );

  return { push, isNavigating } as const;
}
