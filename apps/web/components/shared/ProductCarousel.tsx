'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
  children: ReactNode;
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  showAllButton?: boolean;
  showAllText?: string;
  onShowAll?: () => void;
  maxVisibleItems?: number;
}

export default function ProductCarousel({
  children,
  itemWidth = 280,
  gap = 24,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = '',
  showAllButton = true,
  showAllText = 'Show All',
  onShowAll,
  maxVisibleItems = 4,
}: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      setItemCount(carouselRef.current.children.length);
      // Calculate how many items can be visible at once
      const containerWidth = carouselRef.current.parentElement?.clientWidth || 0;
      const itemsPerView = Math.floor(containerWidth / (itemWidth + gap));
      setVisibleItemsCount(itemsPerView);
    }
  }, [children, itemWidth, gap]);

  useEffect(() => {
    const checkScroll = () => {
      if (!carouselRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      
      // Calculate active index
      const scrollPerItem = itemWidth + gap;
      const newIndex = Math.round(scrollLeft / scrollPerItem);
      setActiveIndex(newIndex);
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', checkScroll);
      }
    };
  }, [itemWidth, gap]);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      if (canScrollRight && carouselRef.current) {
        const scrollAmount = itemWidth + gap;
        carouselRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      } else if (carouselRef.current) {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, canScrollRight, itemWidth, gap]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = itemWidth + gap;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    const scrollAmount = index * (itemWidth + gap);
    carouselRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const visibleDots = Math.ceil(itemCount / 2);

  return (
    <>
      <style jsx>{`
        .carousel-container {
          position: relative;
          width: 100%;
          margin: 0 -var(--spacing-xl);
          padding: 0 var(--spacing-xl);
        }
        .carousel-viewport {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          cursor: grab;
          margin: 0 calc(-1 * var(--spacing-xl));
          padding: 0 var(--spacing-xl);
        }
        .carousel-viewport::-webkit-scrollbar {
          display: none;
        }
        .carousel-viewport.dragging {
          cursor: grabbing;
          scroll-snap-type: none;
        }
        .carousel-track {
          display: flex;
          gap: ${gap}px;
          padding: var(--spacing-md) var(--spacing-xs);
        }
        .carousel-arrow {
          top: 50%;
          width: 48px;
          color: var(--color-on-surface);
          border: none;
          cursor: pointer;
          height: 48px;
          display: flex;
          z-index: 10;
          position: absolute;
          background: var(--color-surface);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          align-items: center;
          border-radius: var(--border-radius-full);
          justify-content: center;
          transform: translateY(-50%);
        }
        .carousel-arrow:hover:not(:disabled) {
          color: var(--color-surface);
          background: var(--color-primary);
          transform: translateY(-50%) scale(1.1);
        }
        .carousel-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .carousel-arrow-left {
          left: -24px;
        }
        .carousel-arrow-right {
          right: -24px;
        }
        .carousel-dots {
          gap: var(--spacing-sm);
          display: flex;
          margin-top: var(--spacing-xl);
          justify-content: center;
        }
        .carousel-dot {
          width: 10px;
          border: none;
          cursor: pointer;
          height: 10px;
          padding: 0;
          background: var(--color-border);
          transition: all 0.3s ease;
          border-radius: var(--border-radius-full);
        }
        .carousel-dot:hover {
          background: var(--color-on-surface-secondary);
        }
        .carousel-dot.active {
          width: 24px;
          background: var(--color-primary);
        }
        .show-all-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md) var(--spacing-xl);
          margin: var(--spacing-xl) auto 0;
          background: transparent;
          color: var(--color-primary);
          border: 2px solid var(--color-primary);
          border-radius: var(--border-radius-lg);
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-base);
          cursor: pointer;
          transition: all 0.3s ease;
          gap: var(--spacing-xs);
        }
        .show-all-button:hover {
          background: var(--color-primary);
          color: var(--color-surface);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 767px) {
          .carousel-arrow {
            display: none;
          }
          .carousel-track {
            padding-left: var(--spacing-xl);
            padding-right: var(--spacing-xl);
          }
        }
      `}</style>

      <div className={`carousel-container ${className}`}>
        {showArrows && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div
          ref={carouselRef}
          className={`carousel-viewport ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="carousel-track">
            {children}
          </div>
        </div>

        {showDots && itemCount > 1 && (
          <div className="carousel-dots">
            {[...Array(Math.min(visibleDots, 7))].map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${Math.floor(activeIndex / 2) === i ? 'active' : ''}`}
                onClick={() => scrollToIndex(i * 2)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {showAllButton && itemCount > (visibleItemsCount || maxVisibleItems) && onShowAll && (
          <button
            className="show-all-button"
            onClick={onShowAll}
            aria-label={showAllText}
          >
            {showAllText}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 12l4-4-4-4" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
