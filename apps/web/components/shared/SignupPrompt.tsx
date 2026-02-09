'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Bell, ShoppingBag, MapPin, Sparkles } from 'lucide-react';

interface SignupPromptProps {
  onSignup: () => void;
}

export default function SignupPrompt({ onSignup }: SignupPromptProps) {
  const t = useTranslations('signupPrompt');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeBubble, setActiveBubble] = useState(0);

  const bubbles = [
    { icon: Bell, text: t('bubble1') },
    { icon: ShoppingBag, text: t('bubble2') },
    { icon: MapPin, text: t('bubble3') },
  ];

  useEffect(() => {
    // Check if user already dismissed or is signed in
    const dismissed = sessionStorage.getItem('rc_signup_dismissed');
    const hasSession = document.cookie.includes('session=');
    if (dismissed || hasSession) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  // Animate bubbles
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveBubble(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    sessionStorage.setItem('rc_signup_dismissed', '1');
    setTimeout(() => setIsVisible(false), 400);
  }, []);

  const handleSignup = useCallback(() => {
    handleDismiss();
    onSignup();
  }, [handleDismiss, onSignup]);

  if (!isVisible) return null;

  return (
    <>
      <style jsx>{`
        .signup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          animation: fadeIn 0.4s ease;
          backdrop-filter: blur(4px);
        }
        .signup-overlay.dismissed {
          animation: fadeOut 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .signup-modal {
          background: #fff;
          border-radius: 24px;
          max-width: 440px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(255, 77, 129, 0.2);
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .signup-modal.dismissed {
          animation: slideDown 0.4s ease forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(40px); opacity: 0; }
        }
        .signup-header {
          background: linear-gradient(135deg, #ff4d81, #ff7ea5);
          padding: 32px 24px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .signup-header::before {
          content: '';
          position: absolute;
          top: -30px;
          right: -30px;
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        .signup-header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: -20px;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
        }
        .signup-close {
          position: absolute;
          top: 12px;
          right: 12px;
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
        .signup-close:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.1);
        }
        .signup-emoji {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
          animation: bounce 2s ease infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .signup-title {
          color: white;
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px;
          position: relative;
          z-index: 1;
          font-family: var(--font-family-heading);
        }
        .signup-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
          position: relative;
          z-index: 1;
        }
        .signup-body {
          padding: 24px;
        }
        .signup-bubbles {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .signup-bubble {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #fef7f5;
          border: 1px solid transparent;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.6;
          transform: translateX(-8px);
        }
        .signup-bubble.active {
          opacity: 1;
          transform: translateX(0);
          border-color: #ff4d81;
          background: linear-gradient(135deg, #fff0f5, #fef7f5);
          box-shadow: 0 4px 16px rgba(255, 77, 129, 0.1);
        }
        .signup-bubble-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ff4d81, #ff7ea5);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .signup-bubble-text {
          font-size: 14px;
          color: #333;
          font-weight: 500;
          line-height: 1.4;
        }
        .signup-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ff4d81, #ff7ea5);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-family-body);
        }
        .signup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 77, 129, 0.3);
        }
        .signup-later {
          display: block;
          margin: 12px auto 0;
          background: none;
          border: none;
          color: #999;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
          font-family: inherit;
        }
        .signup-later:hover {
          color: #666;
          text-decoration: underline;
        }
      `}</style>

      <div className={`signup-overlay ${isDismissed ? 'dismissed' : ''}`} onClick={handleDismiss}>
        <div className={`signup-modal ${isDismissed ? 'dismissed' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="signup-header">
            <button className="signup-close" onClick={handleDismiss}>
              <X size={18} />
            </button>
            <span className="signup-emoji">🌸</span>
            <h2 className="signup-title">{t('title')}</h2>
            <p className="signup-subtitle">{t('subtitle')}</p>
          </div>
          <div className="signup-body">
            <div className="signup-bubbles">
              {bubbles.map((bubble, i) => (
                <div key={i} className={`signup-bubble ${activeBubble === i ? 'active' : ''}`}>
                  <div className="signup-bubble-icon">
                    <bubble.icon size={18} />
                  </div>
                  <span className="signup-bubble-text">{bubble.text}</span>
                </div>
              ))}
            </div>
            <button className="signup-btn" onClick={handleSignup}>
              <Sparkles size={18} />
              {t('signupBtn')}
            </button>
            <button className="signup-later" onClick={handleDismiss}>
              {t('maybeLater')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
