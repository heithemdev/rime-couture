'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  productName: string;
  initialIndex?: number;
}

export default function ImageQuickViewModal({
  isOpen,
  onClose,
  images,
  productName,
  initialIndex = 0,
}: ImageQuickViewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Navigation callbacks (defined first so they can be used in useEffect)
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    if (e.targetTouches[0]) {
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .quick-view-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.95);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .quick-view-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .quick-view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          color: white;
          flex-shrink: 0;
        }

        .quick-view-title {
          font-family: var(--font-family-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-medium);
          margin: 0;
        }

        .quick-view-counter {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.7);
        }

        .quick-view-controls {
          display: flex;
          gap: var(--spacing-sm);
        }

        .quick-view-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: var(--border-radius-full);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-view-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .quick-view-close {
          background: rgba(255, 255, 255, 0.15);
        }

        .quick-view-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .quick-view-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: var(--spacing-md);
        }

        .quick-view-image-wrapper {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-view-image {
          max-width: 100%;
          max-height: calc(100vh - 200px);
          object-fit: contain;
          transition: transform 0.3s ease;
          cursor: zoom-in;
          user-select: none;
          -webkit-user-drag: none;
        }

        .quick-view-image.zoomed {
          cursor: zoom-out;
          transform: scale(1.5);
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: var(--border-radius-full);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-50%) scale(1.1);
        }

        .nav-btn.prev {
          left: var(--spacing-lg);
        }

        .nav-btn.next {
          right: var(--spacing-lg);
        }

        .quick-view-thumbnails {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: center;
          padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
          flex-shrink: 0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .quick-view-thumbnails::-webkit-scrollbar {
          display: none;
        }

        .thumbnail-btn {
          width: 64px;
          height: 64px;
          padding: 0;
          border: 2px solid transparent;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s ease;
          flex-shrink: 0;
          background: transparent;
        }

        .thumbnail-btn:hover {
          opacity: 0.8;
        }

        .thumbnail-btn.active {
          border-color: white;
          opacity: 1;
        }

        .thumbnail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .quick-view-header {
            padding: var(--spacing-sm) var(--spacing-md);
          }

          .quick-view-title {
            font-size: var(--font-size-base);
          }

          .quick-view-btn {
            width: 40px;
            height: 40px;
          }

          .nav-btn {
            width: 44px;
            height: 44px;
          }

          .nav-btn.prev {
            left: var(--spacing-sm);
          }

          .nav-btn.next {
            right: var(--spacing-sm);
          }

          .quick-view-thumbnails {
            padding: var(--spacing-sm) var(--spacing-md);
          }

          .thumbnail-btn {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      <div 
        className="quick-view-overlay" 
        ref={modalRef}
        onClick={handleBackdropClick}
      >
        <div className="quick-view-container">
          {/* Header */}
          <div className="quick-view-header">
            <div>
              <h2 className="quick-view-title">{productName}</h2>
              {images.length > 1 && (
                <span className="quick-view-counter">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
            </div>
            <div className="quick-view-controls">
              <button 
                className="quick-view-btn" 
                onClick={toggleZoom}
                aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
              >
                {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </button>
              <button 
                className="quick-view-btn quick-view-close" 
                onClick={onClose}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Image */}
          <div 
            className="quick-view-main"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {images.length > 1 && (
              <button 
                className="nav-btn prev" 
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div className="quick-view-image-wrapper">
              <img
                src={images[currentIndex]}
                alt={`${productName} - Image ${currentIndex + 1}`}
                className={`quick-view-image ${isZoomed ? 'zoomed' : ''}`}
                onClick={toggleZoom}
                draggable={false}
              />
            </div>

            {images.length > 1 && (
              <button 
                className="nav-btn next" 
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="quick-view-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumbnail-btn ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsZoomed(false);
                  }}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`}
                    className="thumbnail-img"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
