'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Eye, EyeOff, Mail, Lock, Phone, User as UserIcon, ArrowLeft, Loader2, LogOut, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export type AuthMode = 'login' | 'signup';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  phone?: string | null;
}

/**
 * Internal view states:
 * - login / signup / verify-otp / forgot-email / forgot-otp / reset-password / profile
 */
type ViewState =
  | 'login'
  | 'signup'
  | 'verify-otp'
  | 'forgot-email'
  | 'forgot-otp'
  | 'reset-password'
  | 'profile';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthMode;
  onToggleMode: () => void;
  /** Called after successful login/signup */
  onAuthSuccess?: (user: AuthUser) => void;
  /** Called after logout */
  onLogout?: () => void;
  /** Current authenticated user (null = not logged in) */
  currentUser?: AuthUser | null;
}

/* ------------------------------------------------------------------ */
/*  Validation helpers (i18n aware)                                    */
/* ------------------------------------------------------------------ */
function validateName(n: string, t: (k: string) => string): string | null {
  if (!n.trim()) return t('nameRequired');
  if (!/^[\p{L}\s_]{2,60}$/u.test(n.trim())) return t('nameInvalid');
  return null;
}

function validatePhone(p: string, t: (k: string) => string): string | null {
  if (!p.trim()) return t('phoneRequired');
  if (!/^0[567]\d{8}$/.test(p.trim())) return t('phoneInvalid');
  return null;
}

function validateEmail(e: string, t: (k: string) => string): string | null {
  if (!e.trim()) return t('emailRequired');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) return t('emailInvalid');
  return null;
}

function validatePassword(p: string, t: (k: string) => string): string | null {
  if (!p) return t('passwordRequired');
  if (p.length < 8) return t('passwordMin');
  return null;
}

/* ------------------------------------------------------------------ */
/*  InputField                                                         */
/* ------------------------------------------------------------------ */
interface InputFieldProps {
  icon: React.ReactNode;
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  'data-testid'?: string;
  rightSlot?: React.ReactNode;
  error?: string | null;
  maxLength?: number;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
}

function InputField({
  icon, type, name, placeholder, value, onChange,
  autoComplete, 'data-testid': testId, rightSlot, error, maxLength, inputMode,
}: InputFieldProps) {
  return (
    <div className="auth-field">
      <div className={`auth-input-wrap ${error ? 'auth-input-error' : ''}`}>
        <span className="auth-input-icon">{icon}</span>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          data-testid={testId}
          className="auth-input"
          maxLength={maxLength}
          inputMode={inputMode}
        />
        {rightSlot && <span className="auth-input-right">{rightSlot}</span>}
      </div>
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  OTP Input (5 separate boxes, supports paste)                       */
/* ------------------------------------------------------------------ */
function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (char && !/^\d$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char;
    const next = arr.join('').slice(0, 5);
    onChange(next);
    if (char && idx < 4) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 4);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="auth-field">
      <div className="otp-row" onPaste={handlePaste}>
        {[0, 1, 2, 3, 4].map((i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`otp-box ${error ? 'otp-box-error' : ''}`}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            data-testid={`otp-${i}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && <span className="auth-field-error" style={{ textAlign: 'center', display: 'block' }}>{error}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Google inline SVG                                                  */
/* ------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  AuthModal                                                          */
/* ------------------------------------------------------------------ */
export default function AuthModal({
  isOpen,
  onClose,
  mode,
  onToggleMode,
  onAuthSuccess,
  onLogout,
  currentUser,
}: AuthModalProps) {
  const t = useTranslations('auth');

  /* ---- view state ---- */
  const [view, setView] = useState<ViewState>(mode);

  /* ---- form fields ---- */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm, setNewConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  /* ---- feedback ---- */
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ---- stash signup data for OTP verification ---- */
  const signupDataRef = useRef<{ name: string; email: string; phone: string; password: string } | null>(null);
  const forgotEmailRef = useRef('');

  const dialogRef = useRef<HTMLDivElement>(null);

  /* ---- sync view when modal opens ---- */
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setView('profile');
      } else {
        setView(mode);
      }
      resetAll();
    }
  }, [isOpen, mode, currentUser]);

  /* ---- sync view when mode prop changes ---- */
  useEffect(() => {
    if (!currentUser) {
      setView(mode);
      resetAll();
    }
  }, [mode, currentUser]);

  function resetAll() {
    setName(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword('');
    setOtpCode(''); setNewPassword(''); setNewConfirm('');
    setShowPassword(false); setShowConfirm(false);
    setShowNewPassword(false); setShowNewConfirm(false);
    setError(null); setFieldErrors({}); setSuccessMsg(null);
    setIsLoading(false);
  }

  /* ---- ESC to close ---- */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* ---- lock body scroll ---- */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ---- auto-focus first input ---- */
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, view]);

  /* ================================================================ */
  /*  API helper                                                       */
  /* ================================================================ */
  async function apiPost(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }

  /* ================================================================ */
  /*  Handlers                                                         */
  /* ================================================================ */

  /** LOGIN */
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});
    const eErr = validateEmail(email, t);
    const pErr = validatePassword(password, t);
    if (eErr || pErr) { setFieldErrors({ email: eErr, password: pErr }); return; }

    setIsLoading(true);
    try {
      const data = await apiPost('/api/auth/login', { email: email.trim().toLowerCase(), password });
      onAuthSuccess?.(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, onAuthSuccess, onClose, t]);

  /** SIGNUP – sends OTP */
  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});
    const nErr = validateName(name, t);
    const eErr = validateEmail(email, t);
    const phErr = validatePhone(phone, t);
    const pErr = validatePassword(password, t);
    const cErr = password !== confirmPassword ? t('passwordsMismatch') : null;
    if (nErr || eErr || phErr || pErr || cErr) {
      setFieldErrors({ name: nErr, email: eErr, phone: phErr, password: pErr, confirmPassword: cErr });
      return;
    }
    setIsLoading(true);
    try {
      await apiPost('/api/auth/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      signupDataRef.current = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password };
      setOtpCode('');
      setError(null);
      setView('verify-otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }, [name, email, phone, password, confirmPassword, t]);

  /** VERIFY OTP (signup) – creates user + session */
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 5) { setError(t('enterAllDigits')); return; }
    const sd = signupDataRef.current;
    if (!sd) { setError(t('sessionExpired')); return; }

    setIsLoading(true);
    try {
      const data = await apiPost('/api/auth/verify-otp', {
        email: sd.email,
        code: otpCode,
        name: sd.name,
        phone: sd.phone,
        password: sd.password,
      });
      onAuthSuccess?.(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [otpCode, onAuthSuccess, onClose, t]);

  /** FORGOT PASSWORD – enter email */
  const handleForgotEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});
    const eErr = validateEmail(email, t);
    if (eErr) { setFieldErrors({ email: eErr }); return; }

    setIsLoading(true);
    try {
      await apiPost('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      forgotEmailRef.current = email.trim().toLowerCase();
      setOtpCode('');
      setView('forgot-otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  }, [email, t]);

  /** FORGOT OTP – advance to reset view */
  const handleForgotOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 5) { setError(t('enterAllDigits')); return; }
    setView('reset-password');
  }, [otpCode, t]);

  /** RESET PASSWORD */
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});
    const pErr = validatePassword(newPassword, t);
    const cErr = newPassword !== newConfirm ? t('passwordsMismatch') : null;
    if (pErr || cErr) { setFieldErrors({ newPassword: pErr, newConfirm: cErr }); return; }

    setIsLoading(true);
    try {
      await apiPost('/api/auth/reset-password', {
        email: forgotEmailRef.current,
        code: otpCode,
        password: newPassword,
      });
      setSuccessMsg(t('passwordResetSuccess'));
      setTimeout(() => {
        setView('login');
        resetAll();
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, newConfirm, otpCode, t]);

  /** LOGOUT */
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const isAdmin = currentUser?.role === 'ADMIN';
      const logoutUrl = isAdmin ? '/api/auth/admin/logout' : '/api/auth/logout';
      await apiPost(logoutUrl, {});
      onLogout?.();
      onClose();
      if (isAdmin) {
        window.location.href = '/admin/login';
      }
    } catch {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, onClose, currentUser?.role]);

  /* ================================================================ */
  /*  Don't render when closed                                         */
  /* ================================================================ */
  if (!isOpen) return null;

  /* ================================================================ */
  /*  Shared UI pieces                                                 */
  /* ================================================================ */
  const brandEl = (
    <div className="auth-logo-wrap">
      <span className="auth-brand-text">Rimoucha</span>
    </div>
  );

  const backBtn = (target: ViewState) => (
    <button type="button" className="auth-back-btn" onClick={() => { setError(null); setFieldErrors({}); setView(target); }}>
      <ArrowLeft size={18} /><span>{t('back')}</span>
    </button>
  );

  const spinnerEl = isLoading ? <Loader2 size={20} className="auth-spinner" /> : null;

  /* ================================================================ */
  /*  View content                                                     */
  /* ================================================================ */
  let content: React.ReactNode;

  switch (view) {
    /* ───────────── PROFILE (logged in) ───────────── */
    case 'profile':
      content = (
        <>
          <div className="auth-profile-header">
            <div className="auth-profile-avatar">
              <UserIcon size={36} />
            </div>
            <h2 id="auth-title" className="auth-title">
              {t('profileGreeting', { name: currentUser?.displayName || 'User' })}
            </h2>
            {currentUser?.role === 'ADMIN' && (
              <span className="auth-admin-badge">{t('adminBadge')}</span>
            )}
          </div>

          <div className="auth-profile-card">
            <div className="auth-profile-row">
              <Mail size={18} />
              <div className="auth-profile-info">
                <span className="auth-profile-label">{t('profileEmail')}</span>
                <span className="auth-profile-value">{currentUser?.email}</span>
              </div>
            </div>
            {currentUser?.phone && (
              <div className="auth-profile-row">
                <Phone size={18} />
                <div className="auth-profile-info">
                  <span className="auth-profile-label">{t('profilePhone')}</span>
                  <span className="auth-profile-value">{currentUser.phone}</span>
                </div>
              </div>
            )}
          </div>

          {currentUser?.role !== 'ADMIN' && (
            <div className="auth-notification-box">
              <Bell size={20} className="auth-notification-icon" />
              <p className="auth-notification-text">{t('profileNotification')}</p>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="button"
            className="auth-logout-btn"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>{spinnerEl}{t('loggingOut')}</>
            ) : (
              <><LogOut size={18} />{t('logOut')}</>
            )}
          </button>
        </>
      );
      break;

    /* ───────────── LOGIN ───────────── */
    case 'login':
      content = (
        <>
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('welcomeBack')}</h2>
          <p className="auth-subtitle">{t('signInSubtitle')}</p>

          <button type="button" className="auth-google-btn" data-testid="auth-google">
            <GoogleIcon /><span>{t('continueWithGoogle')}</span>
          </button>
          <div className="auth-divider"><span>{t('or')}</span></div>

          <form onSubmit={handleLogin} className="auth-form" noValidate>
            <InputField
              icon={<Mail size={20} />} type="email" name="email" placeholder={t('emailPlaceholder')}
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              data-testid="auth-email" error={fieldErrors.email}
            />
            <InputField
              icon={<Lock size={20} />} type={showPassword ? 'text' : 'password'} name="password"
              placeholder={t('passwordPlaceholder')} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              data-testid="auth-password" error={fieldErrors.password}
              rightSlot={
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <div className="auth-forgot-row">
              <button type="button" className="auth-forgot-link"
                onClick={() => { setError(null); setFieldErrors({}); setView('forgot-email'); }}
                data-testid="auth-forgot">
                {t('forgotPassword')}
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={isLoading} data-testid="auth-submit">
              {spinnerEl}{isLoading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <p className="auth-toggle-row">
            {t('noAccount') + ' '}
            <button type="button" className="auth-toggle-link"
              onClick={() => { onToggleMode(); setView('signup'); }} data-testid="auth-toggle">
              {t('signUp')}
            </button>
          </p>
        </>
      );
      break;

    /* ───────────── SIGNUP ───────────── */
    case 'signup':
      content = (
        <>
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('createAccount')}</h2>
          <p className="auth-subtitle">{t('signupSubtitle')}</p>

          <button type="button" className="auth-google-btn" data-testid="auth-google">
            <GoogleIcon /><span>{t('continueWithGoogle')}</span>
          </button>
          <div className="auth-divider"><span>{t('or')}</span></div>

          <form onSubmit={handleSignup} className="auth-form" noValidate>
            <InputField
              icon={<UserIcon size={20} />} type="text" name="name" placeholder={t('fullNamePlaceholder')}
              value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
              data-testid="auth-name" error={fieldErrors.name} maxLength={60}
            />
            <InputField
              icon={<Mail size={20} />} type="email" name="email" placeholder={t('emailPlaceholder')}
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              data-testid="auth-email" error={fieldErrors.email}
            />
            <InputField
              icon={<Phone size={20} />} type="tel" name="phone" placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(v);
              }}
              autoComplete="tel" data-testid="auth-phone" error={fieldErrors.phone}
              maxLength={10} inputMode="tel"
            />
            <InputField
              icon={<Lock size={20} />} type={showPassword ? 'text' : 'password'} name="password"
              placeholder={t('passwordMinPlaceholder')} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              data-testid="auth-password" error={fieldErrors.password}
              rightSlot={
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide' : 'Show'} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <InputField
              icon={<Lock size={20} />} type={showConfirm ? 'text' : 'password'} name="confirmPassword"
              placeholder={t('confirmPasswordPlaceholder')} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password"
              data-testid="auth-confirm-password" error={fieldErrors.confirmPassword}
              rightSlot={
                <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Hide' : 'Show'} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={isLoading} data-testid="auth-submit">
              {spinnerEl}{isLoading ? t('sendingCode') : t('createAccountBtn')}
            </button>
          </form>

          <p className="auth-toggle-row">
            {t('haveAccount') + ' '}
            <button type="button" className="auth-toggle-link"
              onClick={() => { onToggleMode(); setView('login'); }} data-testid="auth-toggle">
              {t('logIn')}
            </button>
          </p>
        </>
      );
      break;

    /* ───────────── VERIFY OTP (signup) ───────────── */
    case 'verify-otp':
      content = (
        <>
          {backBtn('signup')}
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('checkEmail')}</h2>
          <p className="auth-subtitle">
            {t('otpSentTo')} <strong>{signupDataRef.current?.email}</strong>
          </p>

          <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
            <OtpInput value={otpCode} onChange={setOtpCode} />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={isLoading || otpCode.length < 5} data-testid="auth-submit">
              {spinnerEl}{isLoading ? t('verifying') : t('confirm')}
            </button>
          </form>

          <p className="auth-resend-row">
            {t('didntReceive') + ' '}
            <button type="button" className="auth-toggle-link" onClick={async () => {
              const sd = signupDataRef.current;
              if (!sd) return;
              setIsLoading(true); setError(null);
              try {
                await apiPost('/api/auth/signup', { name: sd.name, email: sd.email, phone: sd.phone, password: sd.password });
                setSuccessMsg(t('codeResent'));
                setTimeout(() => setSuccessMsg(null), 3000);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to resend');
              } finally { setIsLoading(false); }
            }}>{t('resendCode')}</button>
          </p>
          {successMsg && <div className="auth-success">{successMsg}</div>}
        </>
      );
      break;

    /* ───────────── FORGOT PASSWORD – email ───────────── */
    case 'forgot-email':
      content = (
        <>
          {backBtn('login')}
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('forgotPasswordTitle')}</h2>
          <p className="auth-subtitle">{t('forgotPasswordSubtitle')}</p>

          <form onSubmit={handleForgotEmail} className="auth-form" noValidate>
            <InputField
              icon={<Mail size={20} />} type="email" name="email" placeholder={t('emailPlaceholder')}
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              data-testid="auth-email" error={fieldErrors.email}
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={isLoading} data-testid="auth-submit">
              {spinnerEl}{isLoading ? t('sending') : t('sendResetCode')}
            </button>
          </form>
        </>
      );
      break;

    /* ───────────── FORGOT PASSWORD – OTP ───────────── */
    case 'forgot-otp':
      content = (
        <>
          {backBtn('forgot-email')}
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('enterResetCode')}</h2>
          <p className="auth-subtitle">
            {t('resetCodeSentTo')} <strong>{forgotEmailRef.current}</strong>
          </p>

          <form onSubmit={handleForgotOtp} className="auth-form" noValidate>
            <OtpInput value={otpCode} onChange={setOtpCode} />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={otpCode.length < 5} data-testid="auth-submit">
              {t('continue')}
            </button>
          </form>

          <p className="auth-resend-row">
            {t('didntReceive') + ' '}
            <button type="button" className="auth-toggle-link" onClick={async () => {
              setIsLoading(true); setError(null);
              try {
                await apiPost('/api/auth/forgot-password', { email: forgotEmailRef.current });
                setSuccessMsg(t('codeResent'));
                setTimeout(() => setSuccessMsg(null), 3000);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to resend');
              } finally { setIsLoading(false); }
            }}>{t('resendCode')}</button>
          </p>
          {successMsg && <div className="auth-success">{successMsg}</div>}
        </>
      );
      break;

    /* ───────────── RESET PASSWORD ───────────── */
    case 'reset-password':
      content = (
        <>
          {backBtn('forgot-otp')}
          {brandEl}
          <h2 id="auth-title" className="auth-title">{t('setNewPassword')}</h2>
          <p className="auth-subtitle">{t('setNewPasswordSubtitle')}</p>

          <form onSubmit={handleResetPassword} className="auth-form" noValidate>
            <InputField
              icon={<Lock size={20} />} type={showNewPassword ? 'text' : 'password'} name="newPassword"
              placeholder={t('newPasswordPlaceholder')} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password"
              data-testid="auth-new-password" error={fieldErrors.newPassword}
              rightSlot={
                <button type="button" className="auth-eye-btn" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <InputField
              icon={<Lock size={20} />} type={showNewConfirm ? 'text' : 'password'} name="newConfirm"
              placeholder={t('confirmNewPasswordPlaceholder')} value={newConfirm}
              onChange={(e) => setNewConfirm(e.target.value)} autoComplete="new-password"
              data-testid="auth-new-confirm" error={fieldErrors.newConfirm}
              rightSlot={
                <button type="button" className="auth-eye-btn" onClick={() => setShowNewConfirm(v => !v)} tabIndex={-1}>
                  {showNewConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {error && <div className="auth-error">{error}</div>}
            {successMsg && <div className="auth-success">{successMsg}</div>}
            <button type="submit" className="auth-submit-btn" disabled={isLoading} data-testid="auth-submit">
              {spinnerEl}{isLoading ? t('resetting') : t('resetPassword')}
            </button>
          </form>
        </>
      );
      break;
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <>
      <div className="auth-overlay" onClick={onClose} aria-hidden="true" data-testid="auth-overlay" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="auth-dialog"
        data-testid="auth-dialog"
      >
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close" data-testid="auth-close">
          <X size={20} />
        </button>
        <div className="auth-body">{content}</div>
      </div>

      <style jsx global>{`
        .auth-overlay {
          position:fixed; inset:0; z-index:9998;
          background: var(--color-overlay);
          animation: authFadeIn 180ms cubic-bezier(.2,.9,.2,1) both;
        }
        @keyframes authFadeIn { from{opacity:0} to{opacity:1} }

        .auth-dialog {
          position:fixed; z-index:9999;
          bottom:0; left:0; right:0;
          max-height:92dvh; overflow-y:auto;
          background: var(--color-surface);
          border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
          box-shadow: var(--shadow-level-3);
          animation: authSlideUp 180ms cubic-bezier(.2,.9,.2,1) both;
        }
        @keyframes authSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }

        @media (min-width:640px) {
          .auth-dialog {
            bottom:auto; left:50%; top:50%;
            transform:translate(-50%,-50%);
            max-width:440px; width:90vw; max-height:90dvh;
            border-radius: var(--border-radius-lg);
            animation: authScaleIn 180ms cubic-bezier(.2,.9,.2,1) both;
          }
          @keyframes authScaleIn {
            from{transform:translate(-50%,-50%) scale(.95);opacity:0}
            to{transform:translate(-50%,-50%) scale(1);opacity:1}
          }
        }

        .auth-body { padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-2xl); }
        @media (min-width:640px) { .auth-body { padding: var(--spacing-2xl); } }

        .auth-close {
          position:absolute; top:14px; right:14px;
          display:flex; align-items:center; justify-content:center;
          width:36px; height:36px;
          border-radius: var(--border-radius-full);
          border:none; background:transparent;
          color: var(--color-on-surface-secondary);
          cursor:pointer; transition: background 150ms, color 150ms; z-index:1;
        }
        .auth-close:hover { background: var(--color-surface-elevated); color: var(--color-on-surface); }

        .auth-back-btn {
          display:inline-flex; align-items:center; gap:6px;
          background:none; border:none; padding:0 0 var(--spacing-md);
          font-family: var(--font-family-body); font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary); cursor:pointer; transition: color 150ms;
        }
        .auth-back-btn:hover { color: var(--color-on-surface); }

        .auth-logo-wrap { text-align:center; margin-bottom: var(--spacing-md); }
        .auth-brand-text {
          font-family: var(--font-pacifico), 'Pacifico', cursive;
          font-size: 2rem;
          font-weight: 400;
          color: #FF6B9D;
          letter-spacing: 1px;
        }

        .auth-title {
          font-family: var(--font-family-heading); font-weight: var(--font-weight-heading);
          font-size: var(--font-size-xl); line-height: var(--line-height-heading);
          color: var(--color-on-surface); margin:0 0 6px; text-align:center;
        }
        .auth-subtitle {
          font-size: var(--font-size-sm); color: var(--color-on-surface-secondary);
          margin:0 0 var(--spacing-xl); line-height:1.4; text-align:center;
        }
        .auth-subtitle strong { color: var(--color-on-surface); word-break:break-all; }

        .auth-google-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; height:46px; border-radius:10px;
          border:1.5px solid var(--color-border); background: var(--color-surface);
          font-family: var(--font-family-body); font-size: var(--font-size-base);
          font-weight:500; color: var(--color-on-surface); cursor:pointer;
          transition: background 150ms, border-color 150ms;
        }
        .auth-google-btn:hover { background: var(--color-surface-elevated); border-color: var(--color-on-surface-secondary); }

        .auth-divider {
          display:flex; align-items:center; gap:12px;
          margin: var(--spacing-lg) 0;
          color: var(--color-on-surface-secondary); font-size: var(--font-size-sm);
        }
        .auth-divider::before,.auth-divider::after { content:''; flex:1; height:1px; background: var(--color-border); }

        .auth-form { display:flex; flex-direction:column; gap:12px; }

        .auth-field { display:flex; flex-direction:column; gap:4px; }
        .auth-field-error { font-size:12px; color:#e53e3e; padding-left:4px; }

        .auth-input-wrap { position:relative; }
        .auth-input-wrap.auth-input-error .auth-input { border-color:#e53e3e; }
        .auth-input-icon {
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color: var(--color-on-surface-secondary); display:flex; pointer-events:none;
        }
        .auth-input {
          width:100%; height:44px; padding:0 12px 0 42px;
          border:1.5px solid var(--color-border); border-radius:10px;
          font-family: var(--font-family-body); font-size:16px;
          color: var(--color-on-surface); background: var(--color-surface);
          outline:none; transition: border-color 150ms, box-shadow 150ms;
        }
        .auth-input::placeholder { color: var(--color-on-surface-secondary); opacity:.7; }
        .auth-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 15%, transparent);
        }
        .auth-input-right { position:absolute; right:4px; top:50%; transform:translateY(-50%); display:flex; }
        .auth-eye-btn {
          display:flex; align-items:center; justify-content:center; width:36px; height:36px;
          border:none; background:transparent; color: var(--color-on-surface-secondary);
          cursor:pointer; border-radius: var(--border-radius-full); transition: color 150ms, background 150ms;
        }
        .auth-eye-btn:hover { color: var(--color-on-surface); background: var(--color-surface-elevated); }

        .otp-row { display:flex; gap:10px; justify-content:center; margin: var(--spacing-md) 0; }
        .otp-box {
          width:48px; height:56px; text-align:center;
          font-size:24px; font-weight:700; color: var(--color-on-surface);
          border:2px solid var(--color-border); border-radius:12px;
          background: var(--color-surface); outline:none;
          transition: border-color 150ms, box-shadow 150ms;
          font-family: var(--font-family-body);
        }
        .otp-box:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 15%, transparent);
        }
        .otp-box-error { border-color:#e53e3e; }

        .auth-forgot-row { text-align:right; margin-top:-4px; }
        .auth-forgot-link {
          background:none; border:none; padding:0;
          font-family: var(--font-family-body); font-size: var(--font-size-sm);
          color: var(--color-primary); cursor:pointer; transition: opacity 150ms;
        }
        .auth-forgot-link:hover { opacity:.75; }

        .auth-submit-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; height:46px; margin-top:4px;
          border:none; border-radius:10px;
          background: var(--color-primary); color: var(--color-on-primary);
          font-family: var(--font-family-heading); font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor:pointer; transition: filter 150ms, box-shadow 150ms, opacity 150ms;
        }
        .auth-submit-btn:hover:not(:disabled) { filter:brightness(1.06); box-shadow: var(--shadow-level-1); }
        .auth-submit-btn:active:not(:disabled) { filter:brightness(.96); }
        .auth-submit-btn:disabled { opacity:.6; cursor:not-allowed; }

        .auth-spinner { animation: authSpin .8s linear infinite; }
        @keyframes authSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .auth-toggle-row,.auth-resend-row {
          text-align:center; margin-top: var(--spacing-lg);
          font-size: var(--font-size-sm); color: var(--color-on-surface-secondary);
        }
        .auth-toggle-link {
          background:none; border:none; padding:0;
          font-family: var(--font-family-body); font-size: var(--font-size-sm);
          color: var(--color-primary); font-weight:600; cursor:pointer; transition: opacity 150ms;
        }
        .auth-toggle-link:hover { opacity:.75; }

        .auth-error {
          text-align:center; font-size: var(--font-size-sm); color:#e53e3e;
          background: color-mix(in oklab, #e53e3e 8%, transparent);
          border-radius:8px; padding:8px 12px;
        }
        .auth-success {
          text-align:center; font-size: var(--font-size-sm); color:#38a169;
          background: color-mix(in oklab, #38a169 8%, transparent);
          border-radius:8px; padding:8px 12px; margin-top:8px;
        }

        /* ── Profile view styles ── */
        .auth-profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        .auth-profile-avatar {
          width: 72px; height: 72px;
          border-radius: var(--border-radius-full);
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .auth-admin-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 14px;
          border-radius: 20px;
          background: linear-gradient(135deg, #be185d, #9f1239);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .auth-profile-card {
          display: flex; flex-direction: column; gap: 0;
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: var(--spacing-lg);
        }
        .auth-profile-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          color: var(--color-on-surface-secondary);
        }
        .auth-profile-row + .auth-profile-row {
          border-top: 1px solid var(--color-border);
        }
        .auth-profile-info {
          display: flex; flex-direction: column; gap: 2px;
        }
        .auth-profile-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-on-surface-secondary);
          font-weight: 600;
        }
        .auth-profile-value {
          font-size: var(--font-size-base);
          color: var(--color-on-surface);
          word-break: break-all;
        }
        .auth-notification-box {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: color-mix(in oklab, #2dafaa 8%, transparent);
          margin-bottom: var(--spacing-xl);
        }
        .auth-notification-icon {
          color: #2dafaa;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .auth-notification-text {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-on-surface);
          line-height: 1.5;
        }
        .auth-logout-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; height: 46px;
          border: 1.5px solid #e53e3e;
          border-radius: 10px;
          background: transparent;
          color: #e53e3e;
          font-family: var(--font-family-heading);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: background 150ms, color 150ms;
        }
        .auth-logout-btn:hover:not(:disabled) {
          background: #e53e3e;
          color: #fff;
        }
        .auth-logout-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
