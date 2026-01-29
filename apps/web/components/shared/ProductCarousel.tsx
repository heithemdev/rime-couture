'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import SafeLink from '@/components/shared/SafeLink';

interface ProductCarouselProps {
  children: ReactNode;
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  seeAllUrl?: string; // URL for the See All card
  seeAllText?: string; // Text for the See All card
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
  seeAllUrl,
  seeAllText = 'View All Products',
}: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Update total items count (children + see all card)
  useEffect(() => {
    if (carouselRef.current) {
      setTotalItems(carouselRef.current.children.length);
    }
  }, [children, seeAllUrl]);

  // Scroll detection
  useEffect(() => {
    const checkScroll = () => {
      if (!carouselRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      
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

  // AutoPlay logic
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      if (canScrollRight && carouselRef.current) {
        const scrollAmount = itemWidth + gap;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else if (carouselRef.current) {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, canScrollRight, itemWidth, gap]);

  // Scroll Actions
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
    carouselRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  };

  // Drag Handling
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

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Calculate visible dots (approximate)
  const visibleDots = Math.max(1, Math.ceil(totalItems / 2));

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
          /* Negative margin to allow full-width scroll on mobile */
          margin: 0 calc(-1 * var(--spacing-xl));
          padding: 0 var(--spacing-xl);
          /* Add padding bottom to account for hover effects not being cut off */
          padding-bottom: 20px;
          margin-bottom: -20px;
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
        /* Enforce layout on all children (ProductCards and SeeAllCard) */
        .carousel-track > :global(*) {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: ${itemWidth}px;
        }

        /* --- SEE ALL CARD STYLES --- */
        .see-all-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: auto;
          /* Match product card styles roughly for consistency */
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          aspect-ratio: 3 / 4; /* Ensures same height as product cards */
          position: relative;
          overflow: hidden;
        }
        .see-all-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          border-color: var(--color-primary);
          background: linear-gradient(135deg, var(--color-surface) 0%, #FFF0F5 100%);
        }
        .see-all-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 107, 157, 0.1);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
          transition: all 0.4s ease;
        }
        .see-all-card:hover .see-all-icon-circle {
          transform: scale(1.1) rotate(-45deg);
          background: var(--color-primary);
          color: white;
          box-shadow: 0 10px 20px rgba(255, 107, 157, 0.3);
        }
        .see-all-label {
          font-family: var(--font-family-heading);
          font-weight: 600;
          font-size: var(--font-size-lg);
          color: var(--color-on-surface);
          text-align: center;
          padding: 0 var(--spacing-md);
        }
        .see-all-card:hover .see-all-label {
          color: var(--color-primary);
        }

        /* Arrows */
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
          opacity: 0;
          pointer-events: none;
        }
        .carousel-arrow-left { left: -24px; }
        .carousel-arrow-right { right: -24px; }

        /* Dots */
        .carousel-dots {
          gap: var(--spacing-sm);
          display: flex;
          margin-top: var(--spacing-sm);
          justify-content: center;
        }
        .carousel-dot {
          width: 8px;
          height: 8px;
          padding: 0;
          border: none;
          cursor: pointer;
          background: var(--color-border);
          transition: all 0.3s ease;
          border-radius: var(--border-radius-full);
        }
        .carousel-dot.active {
          width: 24px;
          background: var(--color-primary);
        }

        @media (max-width: 767px) {
          .carousel-arrow { display: none; }
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
            
            {/* THE SEE ALL CARD - Renders as the last item in the track */}
            {seeAllUrl && (
              <SafeLink 
                href={seeAllUrl} 
                className="see-all-card"
                newTab={false}
              >
                <div className="see-all-icon-circle">
                  <ArrowRight size={32} />
                </div>
                <span className="see-all-label">{seeAllText}</span>
              </SafeLink>
            )}
          </div>
        </div>

        {showDots && totalItems > 1 && (
          <div className="carousel-dots">
            {[...Array(Math.min(visibleDots, 6))].map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${Math.floor(activeIndex / 2) === i ? 'active' : ''}`}
                onClick={() => scrollToIndex(i * 2)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}