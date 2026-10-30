import { Suspense } from 'react';
import LocationDetailsClient from './LocationDetailsClient';

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '07cf0336-1b6b-45f1-9d53-89910fca337c' },
    { id: 'LOC-102B' },
    { id: 'LOC-206' },
    { id: 'LOC-201' },
    { id: 'LOC-203' },
    { id: 'LOC-305' },
    { id: 'LOC-102' },
    { id: 'L1' },
    { id: 'L2' },
    { id: 'L3' },
    { id: 'L4' },
    { id: 'L5' },
    { id: 'L6' },
  ];
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
