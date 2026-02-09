/**
 * RIME COUTURE - Admin Login Page
 * ================================
 * Standalone login page for admin authentication.
 * Name + Password form → POST /api/auth/admin/login → redirect to /admin
 */

'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// DESIGN TOKENS (matching admin theme)
// ============================================================================

const TOKENS = {
  primary: '#be185d',
  primaryLight: '#f9a8d4',
  primaryDark: '#9d174d',
  surface: '#ffffff',
  surfaceAlt: '#fdf2f8',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  borderFocus: '#be185d',
  error: '#dc2626',
  errorBg: '#fef2f2',
  radius: '12px',
  radiusLg: '16px',
  shadow: '0 4px 24px rgba(0,0,0,0.08)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.12)',
} as const;

export default function AdminLoginPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');

      const trimmedName = name.trim();
      if (!trimmedName || !password) {
        setError('Please enter your name and password.');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Login failed. Please try again.');
          return;
        }

        // Success — redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      } catch {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    },
    [name, password, router]
  );

  return (
    <div className="admin-login-page">
      <div className="login-container">
        {/* Logo / Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Lock size={28} color="#fff" />
          </div>
          <h1 className="brand-title">Rime Couture</h1>
          <p className="brand-subtitle">Admin Panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Error message */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Name field */}
          <div className="field">
            <label htmlFor="admin-name" className="field-label">
              Name
            </label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="field-input"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="field">
            <label htmlFor="admin-password" className="field-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="field-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            className="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="footer-note">
          Protected area · Authorized personnel only
        </p>
      </div>

      {/* Styles */}
      <style jsx>{`
        .admin-login-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%);
          padding: 24px;
          font-family: var(--font-body, 'Work Sans', sans-serif);
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          background: ${TOKENS.surface};
          border-radius: ${TOKENS.radiusLg};
          box-shadow: ${TOKENS.shadowLg};
          padding: 40px 32px 32px;
        }

        /* Brand */
        .brand {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark});
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 4px 16px rgba(190, 24, 93, 0.3);
        }

        .brand-title {
          font-size: 24px;
          font-weight: 700;
          color: ${TOKENS.textPrimary};
          margin: 0 0 4px;
          font-family: var(--font-heading, 'M PLUS Rounded 1c', sans-serif);
        }

        .brand-subtitle {
          font-size: 14px;
          color: ${TOKENS.textSecondary};
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 500;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: ${TOKENS.errorBg};
          color: ${TOKENS.error};
          border-radius: ${TOKENS.radius};
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #fecaca;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: ${TOKENS.textPrimary};
          padding-left: 2px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper :global(.input-icon) {
          position: absolute;
          left: 14px;
          color: ${TOKENS.textSecondary};
          pointer-events: none;
          z-index: 1;
        }

        .field-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid ${TOKENS.border};
          border-radius: ${TOKENS.radius};
          font-size: 14px;
          color: ${TOKENS.textPrimary};
          background: ${TOKENS.surface};
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          font-family: inherit;
        }

        .field-input:focus {
          border-color: ${TOKENS.borderFocus};
          box-shadow: 0 0 0 3px rgba(190, 24, 93, 0.1);
        }

        .field-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field-input::placeholder {
          color: #9ca3af;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: ${TOKENS.textSecondary};
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: ${TOKENS.textPrimary};
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: ${TOKENS.radius};
          background: linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark});
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.1s;
          font-family: inherit;
          margin-top: 4px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .submit-btn :global(.spin) {
          animation: spin 0.8s linear infinite;
        }

        /* Footer */
        .footer-note {
          text-align: center;
          font-size: 12px;
          color: ${TOKENS.textSecondary};
          margin: 24px 0 0;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
