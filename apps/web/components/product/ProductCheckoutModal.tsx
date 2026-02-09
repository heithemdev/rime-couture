/**
 * Product Checkout Modal
 * Full-featured checkout with Yalidine shipping integration
 * - Wilaya selection with shipping prices
 * - Delivery type (HOME / CENTER)
 * - Live price calculation
 * - Algerian phone validation
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  Clock,
  Home,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react';
import {
  WILAYAS_SORTED,
  getWilayaById,
  formatPriceDA,
  type Wilaya,
  type DeliveryType,
} from '@/lib/algeria/wilayas';
import { getBaladiyasForWilaya, type Baladiya } from '@/lib/algeria/baladiya';
import { useFingerprint } from '@/lib/cart-context';
import ThankYouModal from '@/components/shared/ThankYouModal';

export interface SelectedVariant {
  id: string;
  size?: { code: string; label: string } | null;
  color?: { code: string; label: string; hex?: string } | null;
  price: number;
}

// Cart item type for cart checkout
interface CartItemForCheckout {
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
  variant: {
    size: { code: string; label: string } | null;
    color: { code: string; label: string; hex?: string } | null;
  };
  stock: number;
}

interface ProductCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  selectedVariant?: SelectedVariant | null;
  // Cart checkout mode
  isCartCheckout?: boolean;
  cartItems?: CartItemForCheckout[];
}

function normalizePhone(input: string): string {
  return input.replace(/[^\d]/g, '');
}

function isValidAlgerianMobile(phoneDigits: string): boolean {
  return /^(05|06|07)\d{8}$/.test(phoneDigits);
}

export default function ProductCheckoutModal({
  isOpen,
  onClose,
  product,
  quantity,
  selectedVariant,
  isCartCheckout = false,
  cartItems = [],
}: ProductCheckoutModalProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const t = useTranslations('checkout');
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | null>(null);
  const [selectedBaladiyaCode, setSelectedBaladiyaCode] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('HOME');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [wilayaSearch, setWilayaSearch] = useState('');
  const [isWilayaDropdownOpen, setIsWilayaDropdownOpen] = useState(false);
  const [isBaladiyaDropdownOpen, setIsBaladiyaDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  const phoneDigits = useMemo(() => normalizePhone(phone), [phone]);

  // Derived data
  const selectedWilaya = useMemo(
    () => (selectedWilayaId ? getWilayaById(selectedWilayaId) : null),
    [selectedWilayaId]
  );

  const baladiyas = useMemo(
    () => (selectedWilayaId ? getBaladiyasForWilaya(selectedWilayaId) : []),
    [selectedWilayaId]
  );

  const selectedBaladiya = useMemo(
    () => baladiyas.find((b) => b.code === selectedBaladiyaCode) ?? null,
    [baladiyas, selectedBaladiyaCode]
  );

  // Filter wilayas by search
  const filteredWilayas = useMemo(() => {
    if (!wilayaSearch.trim()) return WILAYAS_SORTED;
    const search = wilayaSearch.toLowerCase().trim();
    return WILAYAS_SORTED.filter(
      (w) =>
        w.name.toLowerCase().includes(search) ||
        w.nameAr.includes(search) ||
        w.nameFr.toLowerCase().includes(search) ||
        w.code.includes(search) ||
        String(w.id).includes(search)
    );
  }, [wilayaSearch]);

  // Pricing - supports both single product and cart checkout
  const unitPrice = selectedVariant?.price ?? product.price;
  const subtotal = isCartCheckout && cartItems.length > 0
    ? cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
    : unitPrice * quantity;
  const shippingPrice = selectedWilaya
    ? deliveryType === 'HOME'
      ? selectedWilaya.homeDeliveryPrice
      : selectedWilaya.centerDeliveryPrice
    : 0;
  const deliveryDays = selectedWilaya
    ? deliveryType === 'HOME'
      ? selectedWilaya.homeDeliveryDays
      : selectedWilaya.centerDeliveryDays
    : 0;
  const total = subtotal + shippingPrice;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFullName('');
      setPhone('');
      setSelectedWilayaId(null);
      setSelectedBaladiyaCode(null);
      setDeliveryType('HOME');
      setAddress('');
      setNotes('');
      setWilayaSearch('');
      setPhoneError(null);
      setSubmitError(null);
      setIsSubmitting(false);
      setHasCompleted(false);
      setCompletedOrderNumber(null);
      setIsWilayaDropdownOpen(false);
      setIsBaladiyaDropdownOpen(false);
    }
  }, [isOpen]);

  // Reset baladiya when wilaya changes
  useEffect(() => {
    setSelectedBaladiyaCode(null);
    setIsBaladiyaDropdownOpen(false);
  }, [selectedWilayaId]);

  // Form validation
  const canSubmit =
    fullName.trim().length >= 3 &&
    isValidAlgerianMobile(phoneDigits) &&
    selectedWilayaId !== null &&
    (deliveryType === 'CENTER' || address.trim().length >= 5) &&
    !isSubmitting &&
    !hasCompleted;

  // Handlers
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneError(null);
    const rawDigits = normalizePhone(e.target.value);
    if (rawDigits.length === 0) {
      setPhone('');
      return;
    }
    const digits = rawDigits.slice(0, 10);
    if (digits.length >= 1 && digits[0] !== '0') return;
    if (digits.length >= 2 && !['5', '6', '7'].includes(digits[1]!)) return;
    setPhone(digits);
  }, []);

  const handlePhoneBlur = useCallback(() => {
    if (!phoneDigits) {
      setPhoneError('Phone number is required');
    } else if (!isValidAlgerianMobile(phoneDigits)) {
      setPhoneError('Enter a valid Algerian mobile (05, 06, or 07)');
    } else {
      setPhoneError(null);
    }
  }, [phoneDigits]);

  const handleWilayaSelect = useCallback((wilaya: Wilaya) => {
    setSelectedWilayaId(wilaya.id);
    setIsWilayaDropdownOpen(false);
    setWilayaSearch('');
  }, []);

  const handleBaladiyaSelect = useCallback((baladiya: Baladiya) => {
    setSelectedBaladiyaCode(baladiya.code);
    setIsBaladiyaDropdownOpen(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedWilaya) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Build order data as JSON for both single product and cart checkout
      const orderData: Record<string, unknown> = {
        customerName: fullName.trim(),
        phone: phoneDigits,
        wilayaCode: String(selectedWilaya.id),
        wilayaName: selectedWilaya.name,
        commune: selectedBaladiya?.name ?? selectedWilaya.name,
        deliveryType,
        shippingPrice: shippingPrice,
        // Include fingerprint for user identification
        fingerprint: fingerprint || undefined,
      };

      if (deliveryType === 'HOME') {
        orderData.address = address.trim();
      }
      if (notes.trim()) {
        orderData.notes = notes.trim();
      }

      // For cart checkout, send all items
      if (isCartCheckout && cartItems.length > 0) {
        orderData.items = cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));
      } else {
        // Single product checkout
        orderData.productId = product.id;
        orderData.quantity = quantity;
        if (selectedVariant?.id) {
          orderData.variantId = selectedVariant.id;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(
          (data && data.error) ||
            'Unable to place your order. Please check your details and try again.'
        );
        return;
      }

      setCompletedOrderNumber(data?.order?.orderNumber || null);
      setHasCompleted(true);
    } catch {
      setSubmitError('Unexpected error while creating your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Navigate to orders page
  const handleViewOrders = useCallback(() => {
    onClose();
    router.push('/orders');
  }, [onClose, router]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .checkout-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          overflow-y: auto;
          padding: var(--spacing-md);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .checkout-modal {
          width: 100%;
          max-width: 520px;
          background: var(--color-surface);
          border-radius: var(--border-radius-2xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
          margin: auto;
          overflow: hidden;
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .checkout-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--spacing-lg) var(--spacing-xl);
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
        }
        .checkout-header-content h2 {
          color: white;
          font-size: var(--font-size-lg);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .checkout-header-content p {
          color: rgba(255, 255, 255, 0.9);
          font-size: var(--font-size-sm);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius-full);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .checkout-body {
          padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-xl);
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        
        /* Order Summary */
        .order-summary {
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        .summary-product {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }
        .summary-image {
          width: 64px;
          height: 64px;
          border-radius: var(--border-radius-md);
          background: var(--color-border);
          object-fit: cover;
          flex-shrink: 0;
        }
        .summary-image-placeholder {
          width: 64px;
          height: 64px;
          border-radius: var(--border-radius-md);
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .summary-details {
          flex: 1;
          min-width: 0;
        }
        .summary-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          font-size: var(--font-size-sm);
          line-height: 1.3;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .summary-variant {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--border-radius-full);
          border: 1px solid var(--color-border);
        }
        
        .summary-pricing {
          border-top: 1px dashed var(--color-border);
          padding-top: var(--spacing-md);
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          margin-bottom: 6px;
        }
        .price-row.shipping {
          color: var(--color-secondary);
        }
        .price-row.total {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          margin-top: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          border-top: 2px solid var(--color-border);
          margin-bottom: 0;
        }
        .shipping-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--color-secondary);
          color: white;
          padding: 2px 8px;
          border-radius: var(--border-radius-full);
          font-size: 10px;
          font-weight: var(--font-weight-medium);
        }
        
        /* Form */
        .form-section {
          margin-bottom: var(--spacing-lg);
        }
        .form-section-title {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .form-group {
          margin-bottom: var(--spacing-md);
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: 6px;
        }
        .form-label-icon {
          color: var(--color-secondary);
          width: 14px;
          height: 14px;
        }
        .form-hint {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
          font-weight: normal;
          margin-left: auto;
        }
        
        .form-input {
          width: 100%;
          height: 44px;
          padding: 0 var(--spacing-md);
          font-size: var(--font-size-sm);
          font-family: var(--font-family-body);
          color: var(--color-on-surface);
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          transition: all 0.2s ease;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 77, 129, 0.1);
        }
        .form-input.error {
          border-color: #ef4444;
        }
        .form-input::placeholder {
          color: var(--color-on-surface-secondary);
          opacity: 0.6;
        }
        
        .form-textarea {
          height: auto;
          min-height: 72px;
          padding: var(--spacing-sm) var(--spacing-md);
          resize: vertical;
        }
        
        .form-error {
          font-size: var(--font-size-xs);
          color: #ef4444;
          margin-top: 4px;
        }
        
        /* Dropdown */
        .dropdown-wrapper {
          position: relative;
        }
        .dropdown-trigger {
          width: 100%;
          height: 44px;
          padding: 0 var(--spacing-md);
          font-size: var(--font-size-sm);
          font-family: var(--font-family-body);
          color: var(--color-on-surface);
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dropdown-trigger:hover {
          border-color: var(--color-primary);
        }
        .dropdown-trigger.open {
          border-color: var(--color-primary);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .dropdown-trigger-text {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dropdown-trigger-text.placeholder {
          color: var(--color-on-surface-secondary);
          opacity: 0.6;
        }
        .dropdown-trigger-icon {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .dropdown-trigger.open .dropdown-trigger-icon {
          transform: rotate(180deg);
        }
        
        .dropdown-panel {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-surface);
          border: 2px solid var(--color-primary);
          border-top: none;
          border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
          max-height: 220px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .dropdown-search {
          position: sticky;
          top: 0;
          background: var(--color-surface);
          padding: 8px;
          border-bottom: 1px solid var(--color-border);
        }
        .dropdown-search-input {
          width: 100%;
          height: 36px;
          padding: 0 var(--spacing-sm) 0 32px;
          font-size: var(--font-size-sm);
          font-family: var(--font-family-body);
          color: var(--color-on-surface);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          outline: none;
        }
        .dropdown-search-input:focus {
          border-color: var(--color-primary);
        }
        .dropdown-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-on-surface-secondary);
          width: 14px;
          height: 14px;
        }
        
        .dropdown-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px var(--spacing-md);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .dropdown-option:hover {
          background: var(--color-surface-elevated);
        }
        .dropdown-option.selected {
          background: rgba(255, 77, 129, 0.1);
        }
        .dropdown-option-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dropdown-option-code {
          width: 28px;
          height: 28px;
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-secondary);
        }
        .dropdown-option-name {
          font-size: var(--font-size-sm);
          color: var(--color-on-surface);
        }
        .dropdown-option-price {
          font-size: var(--font-size-xs);
          color: var(--color-secondary);
          font-weight: var(--font-weight-medium);
        }
        .dropdown-empty {
          padding: var(--spacing-lg);
          text-align: center;
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
        }
        
        /* Delivery Type */
        .delivery-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }
        .delivery-option {
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--color-surface);
        }
        .delivery-option:hover {
          border-color: var(--color-primary);
        }
        .delivery-option.selected {
          border-color: var(--color-primary);
          background: rgba(255, 77, 129, 0.05);
        }
        .delivery-option-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .delivery-option-icon {
          width: 32px;
          height: 32px;
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-secondary);
        }
        .delivery-option.selected .delivery-option-icon {
          background: var(--color-primary);
          color: white;
        }
        .delivery-option-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
        }
        .delivery-option-meta {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
        }
        .delivery-option-days {
          color: var(--color-on-surface-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .delivery-option-price {
          color: var(--color-secondary);
          font-weight: var(--font-weight-medium);
        }
        
        /* Submit */
        .submit-btn {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          color: white;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          font-family: var(--font-family-body);
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .submit-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: var(--spacing-md);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
        }
        
        /* Success */
        .success-screen {
          text-align: center;
          padding: var(--spacing-2xl) var(--spacing-xl);
        }
        .success-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, var(--color-secondary) 0%, #0D9488 100%);
          border-radius: var(--border-radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--spacing-lg);
          color: white;
        }
        .success-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-sm);
        }
        .success-message {
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          margin-bottom: var(--spacing-xl);
          line-height: 1.6;
        }
        .success-close-btn {
          background: var(--color-secondary);
          color: white;
          border: none;
          padding: var(--spacing-md) var(--spacing-2xl);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-family-body);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .success-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(45, 175, 170, 0.3);
        }
        .success-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          width: 100%;
          max-width: 280px;
        }
        .success-primary-btn {
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          color: white;
          border: none;
          padding: var(--spacing-md) var(--spacing-2xl);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          font-family: var(--font-family-body);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .success-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        .success-secondary-btn {
          background: transparent;
          color: var(--color-on-surface-secondary);
          border: 1px solid var(--color-border);
          padding: var(--spacing-sm) var(--spacing-xl);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-family-body);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .success-secondary-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      `}</style>

      {hasCompleted && (
        <ThankYouModal
          isOpen={hasCompleted}
          onClose={onClose}
          orderNumber={completedOrderNumber ?? undefined}
          onViewOrders={handleViewOrders}
        />
      )}

      {!hasCompleted && (
      <div className="checkout-overlay" onClick={onClose}>
        <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
          <div className="checkout-header">
            <div className="checkout-header-content">
              <h2>
                <Sparkles size={20} />
                {t('completeOrder')}
              </h2>
              <p>
                <ShieldCheck size={14} />
                {t('securePayOnDelivery')}
              </p>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

            <div className="checkout-body">
              {/* Order Summary */}
              <div className="order-summary">
                <div className="summary-product">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="summary-image" />
                  ) : (
                    <div className="summary-image-placeholder">
                      <Package size={24} />
                    </div>
                  )}
                  <div className="summary-details">
                    <div className="summary-name">{product.name}</div>
                    {selectedVariant && (selectedVariant.size || selectedVariant.color) && (
                      <div className="summary-variant">
                        {selectedVariant.color && (
                          <>
                            <span
                              className="color-dot"
                              style={{ backgroundColor: selectedVariant.color.hex || '#ccc' }}
                            />
                            {selectedVariant.color.label}
                          </>
                        )}
                        {selectedVariant.size && selectedVariant.color && ' • '}
                        {selectedVariant.size && `Size ${selectedVariant.size.label}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="summary-pricing">
                  <div className="price-row">
                    <span>
                      {isCartCheckout && cartItems.length > 0 
                        ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} (${cartItems.reduce((sum, item) => sum + item.quantity, 0)} total)`
                        : `${formatPriceDA(unitPrice)} × ${quantity}`
                      }
                    </span>
                    <span>{formatPriceDA(subtotal)}</span>
                  </div>
                  <div className="price-row shipping">
                    <span>
                      Shipping{' '}
                      {deliveryDays > 0 && (
                        <span className="shipping-badge">
                          <Truck size={10} />
                          {deliveryDays} {deliveryDays === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </span>
                    <span>{shippingPrice > 0 ? formatPriceDA(shippingPrice) : 'Select wilaya'}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total</span>
                    <span>{formatPriceDA(total)}</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Contact Info */}
                <div className="form-section">
                  <div className="form-section-title">
                    <User size={14} />
                    {t('contactInfo')}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <User className="form-label-icon" />
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('enterFullName')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone className="form-label-icon" />
                      {t('phone')}
                      <span className="form-hint">{t('phoneHint')}</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className={`form-input ${phoneError ? 'error' : ''}`}
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      placeholder={t('phonePlaceholder')}
                      maxLength={10}
                      required
                    />
                    {phoneError && <div className="form-error">{phoneError}</div>}
                  </div>
                </div>

                {/* Delivery */}
                <div className="form-section">
                  <div className="form-section-title">
                    <Truck size={14} />
                    {t('deliveryDetails')}
                  </div>

                  {/* Wilaya */}
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin className="form-label-icon" />
                      {t('wilaya')}
                    </label>
                    <div className="dropdown-wrapper">
                      <button
                        type="button"
                        className={`dropdown-trigger ${isWilayaDropdownOpen ? 'open' : ''}`}
                        onClick={() => setIsWilayaDropdownOpen(!isWilayaDropdownOpen)}
                      >
                        <span
                          className={`dropdown-trigger-text ${!selectedWilaya ? 'placeholder' : ''}`}
                        >
                          {selectedWilaya ? (
                            <>
                              <span>{selectedWilaya.code}</span>
                              <span>{selectedWilaya.name}</span>
                            </>
                          ) : (
                            t('selectWilaya')
                          )}
                        </span>
                        <ChevronDown size={18} className="dropdown-trigger-icon" />
                      </button>

                      {isWilayaDropdownOpen && (
                        <div className="dropdown-panel">
                          <div className="dropdown-search">
                            <Search className="dropdown-search-icon" />
                            <input
                              type="text"
                              className="dropdown-search-input"
                              placeholder={t('searchWilayas')}
                              value={wilayaSearch}
                              onChange={(e) => setWilayaSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                          {filteredWilayas.length > 0 ? (
                            filteredWilayas.map((w) => (
                              <div
                                key={w.id}
                                className={`dropdown-option ${selectedWilayaId === w.id ? 'selected' : ''}`}
                                onClick={() => handleWilayaSelect(w)}
                              >
                                <div className="dropdown-option-main">
                                  <span className="dropdown-option-code">{w.code}</span>
                                  <span className="dropdown-option-name">{w.name}</span>
                                </div>
                                <span className="dropdown-option-price">
                                  {formatPriceDA(
                                    deliveryType === 'HOME'
                                      ? w.homeDeliveryPrice
                                      : w.centerDeliveryPrice
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="dropdown-empty">{t('noWilayasFound')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baladiya (Commune) */}
                  {selectedWilayaId && baladiyas.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">
                        <MapPin className="form-label-icon" />
                        {t('commune')}
                        <span className="form-hint">{t('communeOptional')}</span>
                      </label>
                      <div className="dropdown-wrapper">
                        <button
                          type="button"
                          className={`dropdown-trigger ${isBaladiyaDropdownOpen ? 'open' : ''}`}
                          onClick={() => setIsBaladiyaDropdownOpen(!isBaladiyaDropdownOpen)}
                        >
                          <span
                            className={`dropdown-trigger-text ${!selectedBaladiya ? 'placeholder' : ''}`}
                          >
                            {selectedBaladiya ? selectedBaladiya.name : t('selectCommune')}
                          </span>
                          <ChevronDown size={18} className="dropdown-trigger-icon" />
                        </button>

                        {isBaladiyaDropdownOpen && (
                          <div className="dropdown-panel">
                            {baladiyas.map((b) => (
                              <div
                                key={b.code}
                                className={`dropdown-option ${selectedBaladiyaCode === b.code ? 'selected' : ''}`}
                                onClick={() => handleBaladiyaSelect(b)}
                              >
                                <span className="dropdown-option-name">{b.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Type */}
                  {selectedWilaya && (
                    <div className="form-group">
                      <label className="form-label">{t('deliveryType')}</label>
                      <div className="delivery-options">
                        <div
                          className={`delivery-option ${deliveryType === 'HOME' ? 'selected' : ''}`}
                          onClick={() => setDeliveryType('HOME')}
                        >
                          <div className="delivery-option-header">
                            <div className="delivery-option-icon">
                              <Home size={16} />
                            </div>
                            <span className="delivery-option-title">{t('homeDelivery')}</span>
                          </div>
                          <div className="delivery-option-meta">
                            <span className="delivery-option-days">
                              <Clock size={12} />
                              {selectedWilaya.homeDeliveryDays} {selectedWilaya.homeDeliveryDays === 1 ? t('day') : t('days')}
                            </span>
                            <span className="delivery-option-price">
                              {formatPriceDA(selectedWilaya.homeDeliveryPrice)}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`delivery-option ${deliveryType === 'CENTER' ? 'selected' : ''}`}
                          onClick={() => setDeliveryType('CENTER')}
                        >
                          <div className="delivery-option-header">
                            <div className="delivery-option-icon">
                              <Store size={16} />
                            </div>
                            <span className="delivery-option-title">{t('pickupCenter')}</span>
                          </div>
                          <div className="delivery-option-meta">
                            <span className="delivery-option-days">
                              <Clock size={12} />
                              {selectedWilaya.centerDeliveryDays} {selectedWilaya.centerDeliveryDays === 1 ? t('day') : t('days')}
                            </span>
                            <span className="delivery-option-price">
                              {formatPriceDA(selectedWilaya.centerDeliveryPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address (only for HOME delivery) */}
                  {deliveryType === 'HOME' && (
                    <div className="form-group">
                      <label className="form-label">
                        <MapPin className="form-label-icon" />
                        {t('fullAddress')}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t('addressPlaceholder')}
                        required={deliveryType === 'HOME'}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="form-group">
                    <label className="form-label">
                      <MessageSquare className="form-label-icon" />
                      {t('notes')}
                      <span className="form-hint">{t('notesOptional')}</span>
                    </label>
                    <textarea
                      className="form-input form-textarea"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>
                </div>

                {submitError && <div className="submit-error">{submitError}</div>}

                <button type="submit" className="submit-btn" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <Package size={18} />
                      {t('placeOrder')} • {formatPriceDA(total)}
                    </>
                  )}
                </button>
              </form>
            </div>
        </div>
      </div>
      )}
    </>
  );
}
