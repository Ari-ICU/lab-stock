'use client';

import React, { Suspense } from 'react';
import MaintenanceCreateClient from './MaintenanceCreateClient';

export default function MaintenanceCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
          Loading service form...
        </div>
      }
    >
      <MaintenanceCreateClient />
    </Suspense>
  );
}
