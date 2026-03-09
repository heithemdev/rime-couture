import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';

export default function ProductLoading() {
  return (
    <>
      <style>{`
        @keyframes pdp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .pdp-skel {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-xl) var(--spacing-lg);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-2xl);
        }
        .pdp-skel-block {
          border-radius: var(--border-radius-lg, 12px);
          background: linear-gradient(
            90deg,
            var(--color-surface-elevated, #f5f0ee) 0%,
            rgba(255, 77, 129, 0.06) 40%,
            var(--color-surface-elevated, #f5f0ee) 80%
          );
          background-size: 400% 100%;
          animation: pdp-shimmer 1.8s ease-in-out infinite;
        }
        /* Image gallery */
        .pdp-skel-gallery {
          aspect-ratio: 3 / 4;
          max-height: 560px;
        }
        /* Thumbnails */
        .pdp-skel-thumbs {
          display: flex;
          gap: var(--spacing-sm, 8px);
          margin-top: var(--spacing-md, 12px);
        }
        .pdp-skel-thumb {
          width: 60px;
          height: 60px;
          border-radius: var(--border-radius-md, 8px);
          flex-shrink: 0;
        }
        /* Info column */
        .pdp-skel-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg, 16px);
          padding-top: var(--spacing-md, 12px);
        }
        .pdp-skel-title {
          height: 32px;
          width: 70%;
        }
        .pdp-skel-rating {
          height: 20px;
          width: 40%;
        }
        .pdp-skel-price {
          height: 36px;
          width: 30%;
        }
        .pdp-skel-divider {
          height: 1px;
          width: 100%;
          background: var(--color-border, #cfc5bf);
          opacity: 0.4;
        }
        .pdp-skel-label {
          height: 16px;
          width: 25%;
        }
        .pdp-skel-options {
          display: flex;
          gap: var(--spacing-sm, 8px);
        }
        .pdp-skel-option {
          width: 48px;
          height: 40px;
          border-radius: var(--border-radius-md, 8px);
        }
        .pdp-skel-color {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }
        .pdp-skel-desc1 {
          height: 14px;
          width: 100%;
        }
        .pdp-skel-desc2 {
          height: 14px;
          width: 85%;
        }
        .pdp-skel-desc3 {
          height: 14px;
          width: 60%;
        }
        .pdp-skel-btn {
          height: 52px;
          width: 100%;
          border-radius: var(--border-radius-lg, 12px);
          margin-top: var(--spacing-sm, 8px);
        }
        .pdp-skel-actions {
          display: flex;
          gap: var(--spacing-md, 12px);
          margin-top: var(--spacing-xs, 4px);
        }
        .pdp-skel-action {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .pdp-skel {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg, 16px);
            padding: var(--spacing-md, 12px);
          }
          .pdp-skel-gallery {
            max-height: 400px;
          }
        }
      `}</style>

      <Header />
      <main>
        <div className="pdp-skel">
          {/* Left: Image */}
          <div>
            <div className="pdp-skel-block pdp-skel-gallery" />
            <div className="pdp-skel-thumbs">
              {[1,2,3,4].map(i => (
                <div key={i} className="pdp-skel-block pdp-skel-thumb" />
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="pdp-skel-info">
            <div className="pdp-skel-block pdp-skel-title" />
            <div className="pdp-skel-block pdp-skel-rating" />
            <div className="pdp-skel-block pdp-skel-price" />

            <div className="pdp-skel-divider" />

            {/* Sizes */}
            <div className="pdp-skel-block pdp-skel-label" />
            <div className="pdp-skel-options">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="pdp-skel-block pdp-skel-option" />
              ))}
            </div>

            {/* Colors */}
            <div className="pdp-skel-block pdp-skel-label" />
            <div className="pdp-skel-options">
              {[1,2,3].map(i => (
                <div key={i} className="pdp-skel-block pdp-skel-color" />
              ))}
            </div>

            <div className="pdp-skel-divider" />

            {/* Description lines */}
            <div className="pdp-skel-block pdp-skel-desc1" />
            <div className="pdp-skel-block pdp-skel-desc2" />
            <div className="pdp-skel-block pdp-skel-desc3" />

            {/* CTA button */}
            <div className="pdp-skel-block pdp-skel-btn" />

            {/* Action icons */}
            <div className="pdp-skel-actions">
              <div className="pdp-skel-block pdp-skel-action" />
              <div className="pdp-skel-block pdp-skel-action" />
              <div className="pdp-skel-block pdp-skel-action" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
