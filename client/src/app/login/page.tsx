'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, DemoAccount } from '@/context/AuthContext';
import { useStock } from '@/context/StockContext';
import {
  Boxes,
  BarChart2,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Network
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchAccount } = useAuth();
  const { showToast } = useStock();

  const [email, setEmail] = useState('admin@lab.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your laboratory email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email, password, true);
      if (res.success) {
        showToast('Signed in successfully');
        router.push('/');
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setError('An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const handleQuickSignIn = (acc: DemoAccount) => {
    switchAccount(acc);
    showToast(`Signed in as ${acc.name}`);
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans relative flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e150_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e150_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 sm:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-7">
            {/* Brand Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                <Network className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-tight">
                  Lab 102B Management
                </div>
                <div className="text-[#2563eb] font-bold text-xs uppercase tracking-wider mt-0.5">
                  NETWORK LABORATORY & ASSETS
                </div>
              </div>
            </div>

            {/* Department Tag Pill */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 tracking-wider">
                <span className="font-mono text-slate-500 font-bold">&lt;/&gt;</span>
                <span>COMPUTER LAB 102B</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-0.5">
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-slate-900 tracking-tight leading-[1.08]">
                Laboratory
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-slate-900 tracking-tight leading-[1.08]">
                Inventory
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-[#2563eb] tracking-tight leading-[1.08]">
                Stock Portal
              </h1>
            </div>

            {/* Paragraph Subtitle */}
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl">
              A focused workspace for lab administrators and technicians to track network hardware, manage switch racks, and monitor room 102B inventory with confidence.
            </p>

            {/* 3 Feature Highlights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {/* Card 1: Live stock */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
                <div className="text-[#2563eb] mb-2">
                  <Boxes className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  Live stock
                </div>
                <div className="text-[11px] text-slate-500 leading-normal mt-1">
                  Track switch units and cables quickly.
                </div>
              </div>

              {/* Card 2: Clear reports */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
                <div className="text-[#2563eb] mb-2">
                  <BarChart2 className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  Clear reports
                </div>
                <div className="text-[11px] text-slate-500 leading-normal mt-1">
                  See progress by rack, item, and category.
                </div>
              </div>

              {/* Card 3: Secure access */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
                <div className="text-[#2563eb] mb-2">
                  <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  Secure access
                </div>
                <div className="text-[11px] text-slate-500 leading-normal mt-1">
                  Protected sign-in for lab staff.
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto space-y-4">
            {/* Top Notification Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
              <div className="text-xs font-bold text-slate-900">
                Sign in required
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-normal">
                You cannot take action without logging in. Please sign in to continue.
              </div>
            </div>

            {/* Main Sign In Form Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {/* Pill Header */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  LABORATORY ACCESS
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to Lab
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
                Use your staff account to continue to inventory and rack management.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@lab.edu"
                      required
                      disabled={isLoading}
                      className="bg-transparent text-xs text-slate-900 w-full outline-none placeholder:text-slate-400 font-normal"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="bg-transparent text-xs text-slate-900 w-full outline-none placeholder:text-slate-400 font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 transition-colors"
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

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors mt-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Switcher */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Demo Accounts
                </div>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectDemo(acc)}
                      className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition-colors border border-slate-100"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] text-[9px] font-bold flex items-center justify-center shrink-0">
                          {acc.avatarText}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {acc.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickSignIn(acc);
                        }}
                        className="px-2 py-0.5 text-[10px] font-medium bg-white hover:bg-blue-600 hover:text-white text-slate-600 rounded border border-slate-200 transition-colors"
                      >
                        Sign in
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <div className="text-[11px] text-slate-400 text-center px-4 leading-normal">
              By signing in, you agree to the Lab{' '}
              <span className="hover:underline cursor-pointer text-slate-500">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="hover:underline cursor-pointer text-slate-500">
                Privacy Policy
              </span>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
