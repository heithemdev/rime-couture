/**
 * Review Modal Component
 * Premium mobile-first design for writing/editing product reviews
 * - Star rating with touch/click interaction
 * - Character count for comment
 * - Loading states and error handling
 * - Edit mode for existing reviews
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle2, Loader2, Pencil } from 'lucide-react';

interface ExistingReview {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  reviewerName: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productId: string;
  productName: string;
  fingerprint: string;
  editMode?: boolean;
  existingReview?: ExistingReview | null;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  productName,
  fingerprint,
  editMode = false,
  existingReview = null,
}: ReviewModalProps) {
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset/initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editMode && existingReview) {
        // Populate with existing review data
        setRating(existingReview.rating);
        setReviewerName(existingReview.reviewerName || '');
        setTitle(existingReview.title || '');
        setComment(existingReview.comment || '');
      } else {
        // Reset for new review
        setRating(0);
        setReviewerName('');
        setTitle('');
        setComment('');
      }
      setHoverRating(0);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, editMode, existingReview]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          reviewerName: reviewerName.trim() || 'Anonymous',
          fingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit review');
        return;
      }

      setSuccess(true);
      
      // Close after showing success
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [productId, rating, title, comment, reviewerName, fingerprint, onSuccess, onClose]);

  if (!isOpen) return null;

  const displayRating = hoverRating || rating;

  return (
    <>
      <style jsx>{`
        .review-modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--color-overlay);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .review-modal {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          background: var(--color-surface);
          border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        @media (min-width: 640px) {
          .review-modal-overlay {
            align-items: center;
            padding: var(--spacing-xl);
          }
          .review-modal {
            border-radius: var(--border-radius-xl);
            max-height: 85vh;
          }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .review-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg) var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .review-modal-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
        }

        .review-modal-close {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-full);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-surface-secondary);
          transition: all 0.2s ease;
        }
        .review-modal-close:hover {
          background: var(--color-border);
          color: var(--color-on-surface);
        }

        .review-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .review-product-name {
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          margin-bottom: var(--spacing-xl);
          text-align: center;
        }

        /* Rating Section */
        .rating-section {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
        }

        .rating-label {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-md);
        }

        .rating-stars {
          display: flex;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .rating-star {
          width: 48px;
          height: 48px;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease;
        }
        .rating-star:hover {
          transform: scale(1.15);
        }
        .rating-star:active {
          transform: scale(0.95);
        }

        .rating-text {
          margin-top: var(--spacing-md);
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          min-height: 20px;
        }
        .rating-text.has-rating {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        /* Form Fields */
        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-sm);
        }

        .form-label-optional {
          font-weight: var(--font-weight-body);
          color: var(--color-on-surface-secondary);
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-md) var(--spacing-lg);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-base);
          font-family: inherit;
          background: var(--color-surface);
          color: var(--color-on-surface);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 77, 129, 0.15);
        }
        .form-input::placeholder {
          color: var(--color-on-surface-secondary);
          opacity: 0.7;
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.6;
        }

        .char-count {
          text-align: right;
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
          margin-top: var(--spacing-xs);
        }
        .char-count.near-limit {
          color: var(--color-accent);
        }
        .char-count.at-limit {
          color: #ef4444;
        }

        /* Footer */
        .review-modal-footer {
          padding: var(--spacing-lg) var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .submit-btn {
          width: 100%;
          height: 56px;
          border: none;
          border-radius: var(--border-radius-control);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          transition: all 0.2s ease;
        }

        .submit-btn.primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .submit-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        .submit-btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .submit-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        /* Messages */
        .message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }
        .message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        /* Loading Spinner */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div className="review-modal-overlay" onClick={onClose}>
        <div className="review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="review-modal-header">
            <h2 className="review-modal-title">Write a Review</h2>
            <button className="review-modal-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="review-modal-body">
            <p className="review-product-name">{productName}</p>

            {error && (
              <div className="message error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Rating */}
            <div className="rating-section">
              <div className="rating-label">How would you rate this product?</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="rating-star"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={40}
                      fill={star <= displayRating ? '#FFD24A' : 'transparent'}
                      stroke={star <= displayRating ? '#FFD24A' : 'var(--color-border)'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <div className={`rating-text ${rating > 0 ? 'has-rating' : ''}`}>
                {rating === 0 && 'Tap a star to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent!'}
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Your Name <span className="form-label-optional">(optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Anonymous"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value.slice(0, 50))}
                maxLength={50}
              />
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Review Title <span className="form-label-optional">(optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Summarize your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label">
                Your Review <span className="form-label-optional">(optional)</span>
              </label>
              <textarea
                className="form-input form-textarea"
                placeholder="Tell others what you think about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                maxLength={1000}
              />
              <div 
                className={`char-count ${
                  comment.length > 900 ? 'at-limit' : comment.length > 700 ? 'near-limit' : ''
                }`}
              >
                {comment.length}/1000
              </div>
            </div>
          </div>

          <div className="review-modal-footer">
            <button
              className={`submit-btn ${success ? 'success' : 'primary'}`}
              onClick={handleSubmit}
              disabled={isSubmitting || success || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Submitting...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={20} />
                  Review Submitted!
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
