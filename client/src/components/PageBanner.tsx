'use client';

import React from 'react';

export interface BannerStat {
  label: string;
  value: string | number;
  tone?: 'default' | 'emerald' | 'amber' | 'rose' | 'blue';
}

interface PageBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  stats?: BannerStat[];
}

const toneClasses: Record<NonNullable<BannerStat['tone']>, string> = {
  default: 'text-neutral-900',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
  blue: 'text-blue-700',
};

export function PageBanner({ eyebrow, title, description, icon, stats }: PageBannerProps) {
  return (
    <div className="w-full rounded-xl bg-white border border-neutral-200 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {icon}
            <span>{eyebrow}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {stats && stats.length > 0 && (
          <div className="flex items-center divide-x divide-neutral-200 bg-neutral-50 border border-neutral-200/80 rounded-lg px-3 py-2 shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
            {stats.map((stat, idx) => (
              <div key={idx} className="px-3 first:pl-1 last:pr-1 shrink-0">
                <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                  {stat.label}
                </div>
                <div
                  className={`text-sm font-bold font-mono mt-0.5 whitespace-nowrap ${
                    toneClasses[stat.tone || 'default']
                  }`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

