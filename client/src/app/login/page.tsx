'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, DemoAccount } from '@/context/AuthContext';
import { useStock } from '@/context/StockContext';
import {
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Laptop,
  ArrowLeftRight,
  Server
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
      setError('Please enter your laboratory account email.');
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
    showToast(`Signed in as ${acc.name} (${acc.role})`);
    router.push('/');
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
                  src="/logo.png"
                  alt="RUPP University Seal"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight leading-tight font-khmer">
                  សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ
                </div>
                <div className="text-xs font-semibold text-neutral-600 tracking-wide mt-0.5">
                  Faculty of Science 
                </div>
              </div>
            </div>

            {/* Department Tag Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                RUPP LABSTOCK
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
              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Multi-Lab Fleet
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Manage Rm 102B, 206, 201, 203, 305 & 102 Depot.
                </div>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Loans & Relocations
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Student practical checkout and room transfer history.
                </div>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-2xs hover:border-neutral-300 transition-colors">
                <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xs font-bold text-neutral-900">
                  Audit & Barcodes
                </div>
                <div className="text-[11px] text-neutral-500 leading-normal mt-1">
                  Code128 barcode tags, calibration & maintenance logs.
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SIGN IN FORM ================= */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto space-y-4">
            
            {/* Main Sign In Form Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-7 shadow-xs">
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

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-neutral-700 mb-1"
                  >
                    University Email / Account ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@lab.edu"
                      required
                      disabled={isLoading}
                      className="w-full bg-neutral-50/50 text-xs text-neutral-900 pl-9 pr-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 transition-colors"
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
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="w-full bg-neutral-50/50 text-xs text-neutral-900 pl-9 pr-9 py-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors p-1"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
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
                  className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white font-semibold text-xs py-2.5 px-4 rounded shadow-xs transition-colors mt-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
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

              {/* Demo Account Quick Switcher */}
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  One-Click Demo Roles
                </div>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectDemo(acc)}
                      className="flex items-center justify-between p-2 rounded bg-neutral-50 hover:bg-neutral-100 text-left cursor-pointer transition-colors border border-neutral-200/80 group"
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
            </div>

            {/* University Institutional Notice */}
            <div className="text-[11px] text-neutral-500 text-center px-4 leading-normal">
              Royal University of Phnom Penh (RUPP) • Laboratory Management System.
              <br />
              Authorized staff and student access only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
