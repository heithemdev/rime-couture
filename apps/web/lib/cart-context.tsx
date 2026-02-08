/**
 * Cart Context & Provider
 * Global cart state management with localStorage persistence
 * Includes fingerprint generation for spam prevention
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface CartVariant {
  size: { code: string; label: string } | null;
  color: { code: string; label: string; hex?: string } | null;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  variant: CartVariant;
  stock: number;
}

interface CartState {
  id: string | null;
  guestToken: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

interface CartContextValue extends CartState {
  isLoading: boolean;
  error: string | null;
  fingerprint: string;
  addToCart: (productId: string, variantId: string, quantity: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearError: () => void;
  refreshCart: () => Promise<void>;
}

// ============================================================================
// FINGERPRINT GENERATION
// ============================================================================

function generateFingerprint(): string {
  // Collect browser characteristics
  const components: string[] = [];

  // Screen info
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Plugins count
  components.push(String(navigator.plugins?.length || 0));
  
  // Canvas fingerprint (simplified)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }
  
  // WebGL vendor
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
      }
    }
  } catch {
    components.push('no-webgl');
  }

  // Hash the components
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to hex and add random suffix for uniqueness
  const random = Math.random().toString(36).substring(2, 10);
  return `fp_${Math.abs(hash).toString(16)}_${random}`;
}

// ============================================================================
// RETRY UTILITY
// ============================================================================

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      
      // If we get a 5xx error, it might be a transient DB issue - retry
      if (res.status >= 500 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Network error - retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

// ============================================================================
// CONTEXT
// ============================================================================

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

const GUEST_TOKEN_KEY = 'rc_guest_token';
const FINGERPRINT_KEY = 'rc_fingerprint';

interface CartProviderProps {
  children: ReactNode;
  locale?: string;
}

export function CartProvider({ children, locale = 'EN' }: CartProviderProps) {
  // State
  const [cart, setCart] = useState<CartState>({
    id: null,
    guestToken: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState('');

  // Initialize guest token and fingerprint
  useEffect(() => {
    // Get or create guest token
    let token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    setCart((prev) => ({ ...prev, guestToken: token }));

    // Get or create fingerprint
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      fp = generateFingerprint();
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    setFingerprint(fp);
  }, []);

  // Fetch cart on mount with retry logic
  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetchWithRetry(
        `/api/cart?guestToken=${token}&locale=${locale}`,
        undefined,
        3,  // max retries
        1000 // base delay 1s
      );
      
      if (!res.ok) {
        // Don't throw on 404 - cart doesn't exist yet, will be created
        if (res.status === 404) {
          setCart(prev => ({ ...prev, items: [], itemCount: 0, subtotal: 0 }));
          return;
        }
        throw new Error('Failed to fetch cart');
      }
      
      const data = await res.json();
      setCart({
        id: data.id,
        guestToken: data.guestToken,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        subtotal: data.subtotal || 0,
      });
    } catch (err) {
      console.error('Cart fetch error:', err);
      // On error, keep previous cart state but clear loading
      // User can retry or cart will refresh on next action
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (cart.guestToken) {
      refreshCart();
    }
  }, [cart.guestToken, refreshCart]);

  // Add to cart with retry
  const addToCart = useCallback(async (productId: string, variantId: string, quantity: number): Promise<boolean> => {
    setError(null);
    
    const token = localStorage.getItem(GUEST_TOKEN_KEY);
    
    try {
      const res = await fetchWithRetry('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestToken: token,
          productId,
          variantId,
          quantity,
          locale,
        }),
      }, 3, 1000);

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.error || 'Failed to add to cart';
        setError(errorMessage);
        return false;
      }

      // Update local state
      if (data.guestToken && data.guestToken !== token) {
        localStorage.setItem(GUEST_TOKEN_KEY, data.guestToken);
      }

      setCart({
        id: data.id,
        guestToken: data.guestToken,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        subtotal: data.subtotal || 0,
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(errorMessage);
      return false;
    }
  }, [locale]);

  // Update quantity with retry
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setError(null);

    const token = localStorage.getItem(GUEST_TOKEN_KEY);

    try {
      const res = await fetchWithRetry('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestToken: token,
          itemId,
          quantity,
          locale,
        }),
      }, 3, 1000);

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.error || 'Failed to update cart';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setCart({
        id: data.id,
        guestToken: data.guestToken,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        subtotal: data.subtotal || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
      setError(errorMessage);
      throw err;
    }
  }, [locale]);

  // Remove from cart with retry
  const removeFromCart = useCallback(async (itemId: string) => {
    setError(null);

    const token = localStorage.getItem(GUEST_TOKEN_KEY);

    try {
      const res = await fetchWithRetry(
        `/api/cart?guestToken=${token}&itemId=${itemId}&locale=${locale}`,
        { method: 'DELETE' },
        3, 1000
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove item');
      }

      setCart({
        id: data.id,
        guestToken: data.guestToken,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        subtotal: data.subtotal || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
      setError(errorMessage);
      throw err;
    }
  }, [locale]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoized context value
  const value = useMemo<CartContextValue>(() => ({
    ...cart,
    isLoading,
    error,
    fingerprint,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearError,
    refreshCart,
  }), [cart, isLoading, error, fingerprint, addToCart, updateQuantity, removeFromCart, clearError, refreshCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================================================
// HOOK FOR FINGERPRINT ONLY
// ============================================================================

export function useFingerprint(): string {
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      fp = generateFingerprint();
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    setFingerprint(fp);
  }, []);

  return fingerprint;
}
