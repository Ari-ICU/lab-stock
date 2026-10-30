import { Suspense } from 'react';
import LocationDetailsClient from './LocationDetailsClient';

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
          Loading facility details...
        </div>
      }
    >
      <LocationDetailsClient id={id} />
    </Suspense>
  );
}
