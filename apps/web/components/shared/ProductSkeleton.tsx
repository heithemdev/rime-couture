'use client';

interface ProductSkeletonProps {
  count?: number;
  className?: string;
}

export default function ProductSkeleton({ count = 1, className = '' }: ProductSkeletonProps) {
  return (
    <>
      <style jsx>{`
        .skeleton-container {
          display: contents;
        }
        .skeleton-card {
          background: var(--color-surface);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--color-border);
        }
        .skeleton-image {
          aspect-ratio: 3 / 4;
          background: linear-gradient(
            90deg,
            var(--color-surface-elevated) 0%,
            rgba(255, 77, 129, 0.05) 50%,
            var(--color-surface-elevated) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .skeleton-content {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .skeleton-line {
          height: 16px;
          border-radius: var(--border-radius-sm);
          background: linear-gradient(
            90deg,
            var(--color-surface-elevated) 0%,
            rgba(255, 77, 129, 0.08) 50%,
            var(--color-surface-elevated) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .skeleton-line.title {
          width: 75%;
          height: 20px;
        }
        .skeleton-line.subtitle {
          width: 50%;
          height: 14px;
        }
        .skeleton-line.price {
          width: 40%;
          height: 24px;
          margin-top: var(--spacing-xs);
        }
        .skeleton-colors {
          display: flex;
          gap: var(--spacing-xs);
          margin-top: var(--spacing-xs);
        }
        .skeleton-color {
          width: 20px;
          height: 20px;
          border-radius: var(--border-radius-full);
          background: linear-gradient(
            90deg,
            var(--color-surface-elevated) 0%,
            rgba(255, 77, 129, 0.08) 50%,
            var(--color-surface-elevated) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .skeleton-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }
        .skeleton-button {
          flex: 1;
          height: 40px;
          border-radius: var(--border-radius-control);
          background: linear-gradient(
            90deg,
            var(--color-surface-elevated) 0%,
            rgba(255, 77, 129, 0.08) 50%,
            var(--color-surface-elevated) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .skeleton-button.icon {
          flex: 0 0 40px;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        /* Stagger animation for multiple skeletons */
        .skeleton-card:nth-child(1) { animation-delay: 0s; }
        .skeleton-card:nth-child(2) { animation-delay: 0.1s; }
        .skeleton-card:nth-child(3) { animation-delay: 0.2s; }
        .skeleton-card:nth-child(4) { animation-delay: 0.3s; }
        .skeleton-card:nth-child(5) { animation-delay: 0.4s; }
        .skeleton-card:nth-child(6) { animation-delay: 0.5s; }
        .skeleton-card:nth-child(7) { animation-delay: 0.6s; }
        .skeleton-card:nth-child(8) { animation-delay: 0.7s; }
      `}</style>

      <div className={`skeleton-container ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-line title" />
              <div className="skeleton-line subtitle" />
              <div className="skeleton-line price" />
              <div className="skeleton-colors">
                <div className="skeleton-color" />
                <div className="skeleton-color" />
                <div className="skeleton-color" />
              </div>
              <div className="skeleton-actions">
                <div className="skeleton-button" />
                <div className="skeleton-button icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
