'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, DemoAccount } from '@/context/AuthContext';
import { useStock } from '@/context/StockContext';
import {
  Network,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  HelpCircle,
  X,
  Server
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchAccount } = useAuth();
  const { showToast } = useStock();

  const [email, setEmail] = useState('admin@netlab.edu');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email or laboratory ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        setIsSuccess(true);
        showToast('Signed in successfully');
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (account: DemoAccount, index: number) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemoIndex(index);
    setError(null);
  };

  const handleQuickLoginAs = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setIsLoading(true);
    setError(null);
    switchAccount(account);
    showToast(`Signed in as ${account.name}`);
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-between text-neutral-900 font-sans">
      {/* Flat Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 text-white rounded flex items-center justify-center font-bold">
            <Network className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-xs text-neutral-900 leading-none">
              NetLab 102B
            </div>
            <span className="text-[11px] text-neutral-500 font-medium">Room 102B Inventory</span>
          </div>
          <span className="text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
            102B
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded text-xs text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium">Gateway 192.168.102.1 Online</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-4">
          {/* Flat Login Card */}
          <div className="bg-white border border-neutral-200 rounded p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Authentication
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  Engineering Block A
                </span>
              </div>
              <h1 className="text-lg font-bold text-neutral-900">
                Sign In to NetLab 102B
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your credentials to manage computer lab stock, switch racks, and hardware.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="mb-5 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>Authentication successful. Redirecting...</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-neutral-800 mb-1.5"
                >
                  Laboratory Email or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@netlab.edu"
                    required
                    disabled={isLoading || isSuccess}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded pl-9.5 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-neutral-800"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={isLoading || isSuccess}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded pl-9.5 pr-10 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isSuccess}
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer accent-neutral-900"
                  />
                  <span className="text-xs text-neutral-600">Remember this workstation</span>
                </label>

                <span className="text-[11px] text-neutral-400 font-mono">
                  Room 102B
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white text-xs font-semibold py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Signed In</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Accounts List (Flat Style) */}
            <div className="mt-6 pt-5 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Demo Accounts
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Password: password123
                </span>
              </div>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc, index) => {
                  const isSelected = selectedDemoIndex === index && email === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectDemo(acc, index)}
                      className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-neutral-50 border-neutral-900'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {acc.avatarText}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5 truncate">
                            <span>{acc.name}</span>
                            <span className="text-[9px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.2 rounded">
                              {acc.roleBadge}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {acc.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLoginAs(acc);
                        }}
                        className="px-2 py-1 text-[10px] font-semibold text-neutral-800 bg-white hover:bg-neutral-900 hover:text-white border border-neutral-200 rounded transition-colors shrink-0 ml-2"
                      >
                        Instant In
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Flat Notice Box */}
          <div className="bg-white border border-neutral-200 rounded p-3 text-[11px] text-neutral-500 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>
              Authorized laboratory operators only. All changes to network stock and racks are logged.
            </span>
          </div>

          {/* Guest Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Continue to Dashboard as Guest →
            </Link>
          </div>
        </div>
      </main>

      {/* Flat Footer */}
      <footer className="h-14 bg-white border-t border-neutral-200 px-4 sm:px-8 flex items-center justify-between text-xs text-neutral-500 shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-neutral-400" />
          <span>NetLab 102B Stock & Assets</span>
        </div>
        <div>
          <span>Telecommunication & Network Engineering Lab</span>
        </div>
      </footer>

      {/* Forgot Password Modal (Flat Design) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-neutral-100 text-neutral-800 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Account Recovery
                </h3>
                <p className="text-xs text-neutral-500">
                  Engineering Block A - Room 102B
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              NetLab 102B accounts are managed locally by the laboratory administrator. If you forgot your password:
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded p-3 space-y-2 text-xs mb-5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Administrator:</span>
                <span className="font-semibold text-neutral-900">Thoeurn Ratha</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Location:</span>
                <span className="text-neutral-700">Room 102B, Engineering Block A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Admin Email:</span>
                <span className="font-mono text-neutral-900">admin@netlab.edu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Demo Password:</span>
                <span className="font-mono text-emerald-700 font-semibold">password123</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@netlab.edu');
                  setPassword('password123');
                  setShowForgotModal(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              >
                Use Demo Account
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
