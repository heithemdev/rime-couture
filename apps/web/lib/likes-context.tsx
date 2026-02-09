/**
 * Likes Context & Provider
 * Global likes state management with batch fetching
 * Prevents multiple individual API calls per product
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
  useRef,
} from 'react';
import { useFingerprint } from './cart-context';

// ============================================================================
// TYPES
// ============================================================================

interface LikeData {
  likeCount: number;
  isLiked: boolean;
}

interface LikesContextValue {
  // Get like data for a product (returns cached or pending)
  getLikeData: (productId: string) => LikeData | null;
  // Register a product to be fetched in next batch
  registerProduct: (productId: string) => void;
  // Toggle like on a product (returns false if auth required)
  toggleLike: (productId: string) => Promise<boolean>;
  // Check if a like action is in progress
  isLiking: (productId: string) => boolean;
  // Whether user is authenticated (can like)
  isAuthenticated: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const LikesContext = createContext<LikesContextValue | null>(null);

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within LikesProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface LikesProviderProps {
  children: ReactNode;
}

export function LikesProvider({ children }: LikesProviderProps) {
  const fingerprint = useFingerprint();
  
  // Store for like data: productId -> LikeData
  const [likesData, setLikesData] = useState<Record<string, LikeData>>({});
  
  // Products pending fetch
  const pendingProducts = useRef<Set<string>>(new Set());
  
  // Products currently being toggled
  const [likingProducts, setLikingProducts] = useState<Set<string>>(new Set());
  
  // Debounce timer for batch fetch
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if we've done initial fetch
  const hasFetchedRef = useRef(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setIsAuthenticated(!!data.user))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Batch fetch likes for registered products
  const fetchBatchLikes = useCallback(async () => {
    if (pendingProducts.current.size === 0 || !fingerprint) return;
    
    // Get product IDs and clear pending
    const productIds = Array.from(pendingProducts.current);
    pendingProducts.current.clear();
    
    try {
      const res = await fetch(
        `/api/likes?productIds=${productIds.join(',')}&fingerprint=${fingerprint}`
      );
      
      if (!res.ok) throw new Error('Failed to fetch likes');
      
      const data = await res.json();
      
      if (data.success && data.likes) {
        setLikesData(prev => ({
          ...prev,
          ...data.likes,
        }));
      }
    } catch (err) {
      console.error('Batch fetch likes error:', err);
      // On error, products remain unfetched - they can be re-registered
    }
  }, [fingerprint]);

  // Register a product for batch fetching
  const registerProduct = useCallback((productId: string) => {
    // Skip if already have data or already pending
    if (likesData[productId] || pendingProducts.current.has(productId)) {
      return;
    }
    
    pendingProducts.current.add(productId);
    
    // Clear existing timer
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }
    
    // Set new timer - batch fetch after 50ms of no new registrations
    batchTimerRef.current = setTimeout(() => {
      fetchBatchLikes();
    }, 50);
  }, [likesData, fetchBatchLikes]);

  // Get like data for a product
  const getLikeData = useCallback((productId: string): LikeData | null => {
    return likesData[productId] || null;
  }, [likesData]);

  // Toggle like on a product - returns false if auth required
  const toggleLike = useCallback(async (productId: string): Promise<boolean> => {
    if (!fingerprint) return false;
    
    // Require authentication
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }));
      return false;
    }
    
    // Mark as liking
    setLikingProducts(prev => new Set(prev).add(productId));
    
    // Optimistic update
    const current = likesData[productId];
    if (current) {
      setLikesData(prev => ({
        ...prev,
        [productId]: {
          likeCount: current.isLiked 
            ? Math.max(0, current.likeCount - 1) 
            : current.likeCount + 1,
          isLiked: !current.isLiked,
        },
      }));
    }
    
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, fingerprint }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
      
      // Update with server response
      setLikesData(prev => ({
        ...prev,
        [productId]: {
          likeCount: data.likeCount,
          isLiked: data.liked,
        },
      }));
      return true;
    } catch (err) {
      console.error('Toggle like error:', err);
      // Revert optimistic update
      if (current) {
        setLikesData(prev => ({
          ...prev,
          [productId]: current,
        }));
      }
      return false;
    } finally {
      setLikingProducts(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, [fingerprint, likesData, isAuthenticated]);

  // Check if product is being liked
  const isLiking = useCallback((productId: string): boolean => {
    return likingProducts.has(productId);
  }, [likingProducts]);

  // Reset when fingerprint changes
  useEffect(() => {
    if (fingerprint && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      // Initial fetch will happen when products register themselves
    }
  }, [fingerprint]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  const value = useMemo<LikesContextValue>(() => ({
    getLikeData,
    registerProduct,
    toggleLike,
    isLiking,
    isAuthenticated,
  }), [getLikeData, registerProduct, toggleLike, isLiking, isAuthenticated]);

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
}
