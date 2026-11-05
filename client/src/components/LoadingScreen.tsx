'use client';

import React from 'react';
import { Loader2, FlaskConical } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = 'Loading laboratory equipment & records...',
  submessage = 'Connecting to laboratory database...',
  fullScreen = false,
}: LoadingScreenProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50/95 backdrop-blur-xs p-6'
    : 'flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center max-w-sm mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-800">
            <FlaskConical className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center text-white shadow-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1 text-center">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            {message}
          </h3>
          <p className="text-[11px] text-neutral-400 font-mono">
            {submessage}
          </p>
        </div>

        {/* Subtle Progress Shimmer */}
        <div className="w-40 h-1 bg-neutral-200/80 rounded-full overflow-hidden mt-1">
          <div className="w-full h-full bg-emerald-500 rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;

