import { Suspense } from 'react';
import { mockLocations } from '@/data/mockData';
import LocationDetailsClient from './LocationDetailsClient';

export function generateStaticParams() {
  const ids = new Set<string>();
  mockLocations.forEach((loc) => {
    ids.add(loc.id);
    ids.add(loc.room.replace(/\s+/g, '-'));
  });
  // Pre-render known legacy codes and backend IDs so GitHub Pages static export includes them
  ids.add('LOC-102B');
  ids.add('LOC-206');
  ids.add('LOC-201');
  ids.add('LOC-203');
  ids.add('LOC-305');
  ids.add('LOC-102');
  ids.add('07cf0336-1b6b-45f1-9d53-89910fca337c');
  return Array.from(ids).map((id) => ({ id }));
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

