'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Heart, Package, Sparkles } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
  onViewOrders?: () => void;
}

export default function ThankYouModal({ isOpen, onClose, orderNumber, onViewOrders }: ThankYouModalProps) {
  const t = useTranslations('thankYou');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowConfetti(true), 300);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .thankyou-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          animation: thankyouFadeIn 0.3s ease;
          backdrop-filter: blur(6px);
        }
        @keyframes thankyouFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .thankyou-modal {
          background: #fff;
          border-radius: 24px;
          max-width: 420px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(255, 77, 129, 0.25);
          animation: thankyouSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        @keyframes thankyouSlideUp {
          from { transform: translateY(60px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .thankyou-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 2;
        }
        .thankyou-close:hover {
          background: rgba(255, 255, 255, 0.35);
        }
        .thankyou-header {
          background: linear-gradient(135deg, #ff4d81, #ff7ea5, #fbbf24);
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
          padding: 40px 24px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .thankyou-confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .thankyou-confetti span {
          position: absolute;
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confettiFall 3s ease-in-out infinite;
        }
        .thankyou-confetti span:nth-child(1) { left: 10%; background: #fbbf24; animation-delay: 0s; animation-duration: 2.5s; }
        .thankyou-confetti span:nth-child(2) { left: 25%; background: #34d399; animation-delay: 0.3s; animation-duration: 3s; width: 8px; height: 8px; }
        .thankyou-confetti span:nth-child(3) { left: 40%; background: #60a5fa; animation-delay: 0.6s; animation-duration: 2.8s; border-radius: 50%; }
        .thankyou-confetti span:nth-child(4) { left: 55%; background: #f472b6; animation-delay: 0.2s; animation-duration: 3.2s; }
        .thankyou-confetti span:nth-child(5) { left: 70%; background: #a78bfa; animation-delay: 0.5s; animation-duration: 2.6s; width: 12px; height: 6px; }
        .thankyou-confetti span:nth-child(6) { left: 85%; background: #fbbf24; animation-delay: 0.8s; animation-duration: 3s; border-radius: 50%; width: 6px; height: 6px; }
        @keyframes confettiFall {
          0% { top: -10%; transform: rotate(0deg) scale(1); opacity: 1; }
          100% { top: 110%; transform: rotate(720deg) scale(0.3); opacity: 0; }
        }
        .thankyou-icon-wrap {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: iconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
          position: relative;
          z-index: 1;
        }
        @keyframes iconPop {
          from { transform: scale(0) rotate(-20deg); }
          to { transform: scale(1) rotate(0deg); }
        }
        .thankyou-title {
          color: white;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          font-family: var(--font-family-heading);
          position: relative;
          z-index: 1;
        }
        .thankyou-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 15px;
          margin: 0;
          line-height: 1.5;
          position: relative;
          z-index: 1;
        }
        .thankyou-body {
          padding: 28px 24px;
          text-align: center;
        }
        .thankyou-order-number {
          display: inline-block;
          padding: 8px 20px;
          background: #fef7f5;
          border: 2px dashed #ff4d81;
          border-radius: 10px;
          color: #ff4d81;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }
        .thankyou-message {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .thankyou-features {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
        }
        .thankyou-feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .thankyou-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thankyou-feature-icon.pink { background: #fff0f5; color: #ff4d81; }
        .thankyou-feature-icon.teal { background: #f0fdfa; color: #14b8a6; }
        .thankyou-feature-icon.amber { background: #fffbeb; color: #f59e0b; }
        .thankyou-feature-text {
          font-size: 11px;
          color: #999;
          font-weight: 500;
        }
        .thankyou-btn-primary {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ff4d81, #ff7ea5);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: var(--font-family-body);
          margin-bottom: 10px;
        }
        .thankyou-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 77, 129, 0.3);
        }
        .thankyou-btn-secondary {
          width: 100%;
          padding: 12px;
          background: none;
          color: #999;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-family-body);
        }
        .thankyou-btn-secondary:hover {
          border-color: #ccc;
          color: #666;
        }
      `}</style>

      <div className="thankyou-overlay" onClick={onClose}>
        <div className="thankyou-modal" onClick={e => e.stopPropagation()}>
          <button className="thankyou-close" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="thankyou-header">
            {showConfetti && (
              <div className="thankyou-confetti">
                <span /><span /><span /><span /><span /><span />
              </div>
            )}
            <div className="thankyou-icon-wrap">
              <Heart size={36} color="white" fill="white" />
            </div>
            <h2 className="thankyou-title">{t('title')}</h2>
            <p className="thankyou-subtitle">{t('subtitle')}</p>
          </div>
          <div className="thankyou-body">
            {orderNumber && (
              <div className="thankyou-order-number">#{orderNumber}</div>
            )}
            <p className="thankyou-message">{t('message')}</p>
            <div className="thankyou-features">
              <div className="thankyou-feature">
                <div className="thankyou-feature-icon pink"><Sparkles size={20} /></div>
                <span className="thankyou-feature-text">{t('handmade')}</span>
              </div>
              <div className="thankyou-feature">
                <div className="thankyou-feature-icon teal"><Package size={20} /></div>
                <span className="thankyou-feature-text">{t('shipped')}</span>
              </div>
              <div className="thankyou-feature">
                <div className="thankyou-feature-icon amber"><Heart size={20} /></div>
                <span className="thankyou-feature-text">{t('withLove')}</span>
              </div>
            </div>
            {onViewOrders && (
              <button className="thankyou-btn-primary" onClick={onViewOrders}>
                {t('viewOrders')}
              </button>
            )}
            <button className="thankyou-btn-secondary" onClick={onClose}>
              {t('continueShopping')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
