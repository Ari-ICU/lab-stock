'use client';

import React, { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useAuth,
  DEMO_ACCOUNTS,
  DemoAccount,
  AuthErrorCode,
} from '@/context/AuthContext';
import { useStock } from '@/context/StockContext';
import { getAssetPath } from '@/lib/basePath';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  AlertTriangle,
  WifiOff,
  Clock,
  RefreshCw,
  ArrowLeftRight,
  Server,
  X,
} from 'lucide-react';

interface LoginErrorState {
  code: AuthErrorCode | 'CLIENT_VALIDATION';
  title: string;
  message: string;
  hint?: string;
  field?: 'email' | 'password' | 'both';
}

function buildAuthError(
  errorCode: AuthErrorCode | undefined,
  rawMessage: string | undefined,
  email: string
): LoginErrorState {
  const cleanEmail = email.trim().toLowerCase();
  const isUniversityDomain =
    cleanEmail.endsWith('@rupp.edu.kh') || cleanEmail.endsWith('@lab.edu');

  switch (errorCode) {
    case 'FORBIDDEN':
      return {
        code: 'FORBIDDEN',
        title: 'Account access restricted',
        message:
          rawMessage ||
          'This account does not have operator permissions to sign in.',
        hint: 'Only Primary Lab Administrators, Department Administrators, and Faculty Lecturers can access the portal.',
        field: 'email',
      };
    case 'RATE_LIMITED':
      return {
        code: 'RATE_LIMITED',
        title: 'Too many sign-in attempts',
        message:
          rawMessage ||
          'Sign-in is temporarily paused due to repeated failed attempts.',
        hint: 'Wait about a minute before trying again, or verify your credentials carefully.',
      };
    case 'TIMEOUT':
      return {
        code: 'TIMEOUT',
        title: 'Server request timed out',
        message:
          rawMessage ||
          'The authentication server took too long to respond.',
        hint: 'Check your network connection and retry signing in.',
      };
    case 'NETWORK_ERROR':
      return {
        code: 'NETWORK_ERROR',
        title: 'Authentication server unreachable',
        message:
          rawMessage ||
          'Unable to connect to the backend authentication server.',
        hint: 'Ensure the API server is online and reachable from your browser (HTTPS deployments require an HTTPS API endpoint).',
      };
    case 'SERVER_ERROR':
      return {
        code: 'SERVER_ERROR',
        title: 'Server error during sign-in',
        message:
          rawMessage ||
          'The server encountered an unexpected issue while signing you in.',
        hint: 'Please wait a moment and try again.',
      };
    case 'VALIDATION':
      return {
        code: 'VALIDATION',
        title: 'Check your login details',
        message:
          rawMessage || 'Please review your email and password format.',
        field: 'both',
      };
    case 'INVALID_CREDENTIALS':
    default:
      return {
        code: 'INVALID_CREDENTIALS',
        title: 'Sign-in failed',
        message: rawMessage || 'Invalid email or password credentials.',
        hint: isUniversityDomain
          ? 'Verify that your password is correct and Caps Lock is turned off.'
          : 'Make sure Caps Lock is off, and check your account email (faculty & staff accounts typically use an @rupp.edu.kh address).',
        field: 'both',
      };
  }
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, switchAccount } = useAuth();
  const { showToast } = useStock();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<LoginErrorState | null>(null);
  const [expiredDismissed, setExpiredDismissed] = useState(false);

  const isSessionExpiredNotice =
    searchParams.get('reason') === 'expired' && !expiredDismissed && !errorState;

  const attemptLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorState({
        code: 'CLIENT_VALIDATION',
        title: 'Email required',
        message: 'Please enter your laboratory account email.',
        hint: 'Example: thoeurn.ratha@rupp.edu.kh',
        field: 'email',
      });
      emailRef.current?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorState({
        code: 'CLIENT_VALIDATION',
        title: 'Invalid email format',
        message: 'Enter a valid email address before signing in.',
        hint: 'Example: thoeurn.ratha@rupp.edu.kh',
        field: 'email',
      });
      emailRef.current?.focus();
      return;
    }

    if (!password) {
      setErrorState({
        code: 'CLIENT_VALIDATION',
        title: 'Password required',
        message: 'Please enter your account password.',
        field: 'password',
      });
      passwordRef.current?.focus();
      return;
    }

    setErrorState(null);
    setIsLoading(true);

    try {
      const res = await login(trimmedEmail, password, true);
      if (res.success) {
        showToast('Signed in successfully');
        router.push('/');
      } else {
        setErrorState(buildAuthError(res.errorCode, res.error, trimmedEmail));
      }
    } catch {
      setErrorState({
        code: 'UNKNOWN',
        title: 'Unexpected sign-in error',
        message: 'An unexpected authentication error occurred.',
        hint: 'Please try again or refresh the page.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await attemptLogin();
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorState(null);
  };

  const handleQuickSignIn = async (acc: DemoAccount) => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await switchAccount(acc);
      if (res.success) {
        showToast(`Signed in as ${acc.name} (${acc.role})`);
        router.push('/');
      } else {
        setErrorState(buildAuthError(res.errorCode, res.error, acc.email));
      }
    } catch {
      setErrorState({
        code: 'UNKNOWN',
        title: 'Demo sign-in failed',
        message: 'An unexpected authentication error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasEmailError =
    errorState?.field === 'email' || errorState?.field === 'both';
  const hasPasswordError =
    errorState?.field === 'password' || errorState?.field === 'both';

  const isWarningVariant =
    errorState?.code === 'NETWORK_ERROR' ||
    errorState?.code === 'TIMEOUT' ||
    errorState?.code === 'SERVER_ERROR' ||
    errorState?.code === 'RATE_LIMITED';

  const renderErrorIcon = () => {
    if (!errorState) return null;
    if (errorState.code === 'NETWORK_ERROR') {
      return <WifiOff className="w-4 h-4" />;
    }
    if (errorState.code === 'TIMEOUT' || errorState.code === 'RATE_LIMITED') {
      return <Clock className="w-4 h-4" />;
    }
    if (errorState.code === 'FORBIDDEN') {
      return <ShieldAlert className="w-4 h-4" />;
    }
    if (errorState.code === 'SERVER_ERROR') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50/70 text-neutral-900 font-sans relative flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Subtle modern dot-grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-80" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* ================= LEFT COLUMN: INSTITUTIONAL BRANDING ================= */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* University Seal & Nomenclature */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 p-1.5 shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src={getAssetPath('/logo.png')}
                  alt="CSD Stock Emblem"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.tried) {
                      img.dataset.tried = 'true';
                      if (
                        typeof window !== 'undefined' &&
                        window.location.pathname.startsWith('/lab-stock')
                      ) {
                        img.src = '/lab-stock/logo.png';
                      }
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-base sm:text-lg text-neutral-900 tracking-tight leading-tight font-khmer-muol font-bold">
                  សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-neutral-900 tracking-wide mt-0.5">
                  Faculty of Science
                </div>
              </div>
            </div>

            {/* Department Tag Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                CSD STOCK
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                6 Connected Lab Classrooms
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-[1.15]">
                Laboratory Inventory &
              </h1>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-[1.15]">
                Asset Management System
              </h1>
            </div>

            {/* Paragraph Subtitle */}
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              Centralized platform for faculty administrators, lecturers, and technicians. Monitor PC workstations, manage student device lending, track inter-room relocations, and oversee network infrastructure with full auditability.
            </p>

            {/* 3 Feature Highlights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Multi-Lab Fleet
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Manage Room 102B, 206, 201, 203, 305 & 102 Depot.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Loans & Relocations
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Student practical checkout and room transfer history.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Audit & Asset Tags
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Serialized asset tags, SKU tracking &amp; check-out logs.
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SIGN IN FORM ================= */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto space-y-4">
            {/* Main Sign In Form Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-neutral-600 uppercase tracking-wider bg-neutral-100 border border-neutral-200 font-mono">
                  STAFF & TECHNICIAN ACCESS
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Sign in to Laboratory Portal
              </h2>
              <p className="text-xs text-neutral-500 mt-1 mb-5 leading-relaxed">
                Enter your university credentials or select a verified lab role below.
              </p>

              {/* Session Expired Notice */}
              {isSessionExpiredNotice && (
                <div
                  role="status"
                  className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 border-l-4 border-l-amber-500 flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-950">
                      Session expired
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Your security session timed out. Please sign in again to continue.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpiredDismissed(true)}
                    aria-label="Dismiss notice"
                    className="text-amber-500 hover:text-amber-800 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Structured Authentication Error Card */}
              {errorState && (
                <div
                  id="login-error-alert"
                  role="alert"
                  aria-live="assertive"
                  className={`mb-4 p-3.5 rounded-xl border border-l-4 flex items-start gap-3 transition-all ${
                    isWarningVariant
                      ? 'bg-amber-50/80 border-amber-200 border-l-amber-500'
                      : 'bg-rose-50/75 border-rose-200 border-l-rose-500'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      isWarningVariant
                        ? 'bg-amber-100/80 text-amber-700 border-amber-200'
                        : 'bg-rose-100/80 text-rose-600 border-rose-200'
                    }`}
                  >
                    {renderErrorIcon()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold leading-snug ${
                        isWarningVariant ? 'text-amber-950' : 'text-rose-950'
                      }`}
                    >
                      {errorState.title}
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isWarningVariant ? 'text-amber-900' : 'text-rose-800'
                      }`}
                    >
                      {errorState.message}
                    </p>
                    {errorState.hint && (
                      <p
                        className={`text-[11px] mt-1.5 leading-relaxed ${
                          isWarningVariant ? 'text-amber-800/90' : 'text-rose-700/90'
                        }`}
                      >
                        {errorState.hint}
                      </p>
                    )}

                    {/* Contextual Quick Recovery Actions */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {(errorState.code === 'NETWORK_ERROR' ||
                        errorState.code === 'TIMEOUT' ||
                        errorState.code === 'SERVER_ERROR') && (
                        <button
                          type="button"
                          onClick={attemptLogin}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-[11px] font-semibold text-amber-900 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Sign In</span>
                        </button>
                      )}
                      {errorState.code === 'INVALID_CREDENTIALS' && password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-100/60 text-[11px] font-semibold text-rose-800 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          <span>{showPassword ? 'Hide password' : 'Check typed password'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setErrorState(null)}
                    aria-label="Dismiss error"
                    title="Dismiss error"
                    className={`p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-0.5 cursor-pointer ${
                      isWarningVariant
                        ? 'text-amber-500 hover:text-amber-800 hover:bg-amber-100/80'
                        : 'text-rose-400 hover:text-rose-700 hover:bg-rose-100/80'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-neutral-700 mb-1"
                  >
                    University Email / Account ID
                  </label>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                        hasEmailError ? 'text-rose-500' : 'text-neutral-400'
                      }`}
                    />
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorState) setErrorState(null);
                      }}
                      placeholder="thoeurn.ratha@rupp.edu.kh"
                      disabled={isLoading}
                      aria-invalid={hasEmailError || undefined}
                      aria-describedby={errorState ? 'login-error-alert' : undefined}
                      className={`w-full text-xs text-neutral-900 pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-colors ${
                        hasEmailError
                          ? 'bg-rose-50/40 border-rose-300 focus:border-rose-600 focus:ring-rose-500/30'
                          : 'bg-neutral-50/50 border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-neutral-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                        hasPasswordError ? 'text-rose-500' : 'text-neutral-400'
                      }`}
                    />
                    <input
                      ref={passwordRef}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorState) setErrorState(null);
                      }}
                      placeholder="••••••••"
                      disabled={isLoading}
                      aria-invalid={hasPasswordError || undefined}
                      aria-describedby={errorState ? 'login-error-alert' : undefined}
                      className={`w-full text-xs text-neutral-900 pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-colors font-mono ${
                        hasPasswordError
                          ? 'bg-rose-50/40 border-rose-300 focus:border-rose-600 focus:ring-rose-500/30'
                          : 'bg-neutral-50/50 border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors p-1"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors mt-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to Faculty Fleet</span>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Switcher (Development Only) */}
              {process.env.NODE_ENV !== 'production' && DEMO_ACCOUNTS.length > 0 && (
                <div className="mt-5 pt-4 border-t border-neutral-100">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    One-Click Demo Roles
                  </div>
                  <div className="space-y-1.5">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <div
                        key={acc.email}
                        onClick={() => handleSelectDemo(acc)}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left cursor-pointer transition-colors border border-neutral-200/80 group"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded bg-neutral-900 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {acc.avatarText}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 truncate">
                              {acc.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">
                              {acc.role} • {acc.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickSignIn(acc);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-white group-hover:bg-neutral-900 group-hover:text-white text-neutral-700 rounded border border-neutral-300 transition-colors shadow-2xs"
                        >
                          Sign in
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* University Institutional Notice */}
            <div className="text-[11px] text-neutral-500 text-center px-4 leading-normal">
              CSD Stock • Faculty of Science Laboratory Management System.
              <br />
              Authorized staff and student access only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Laboratory Portal..." />}>
      <LoginFormContent />
    </Suspense>
  );
}
