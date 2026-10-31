import { Suspense } from 'react';
import RoomItemDetailsClient from './RoomItemDetailsClient';
import { LOCATION_STATIC_PARAMS } from '../shared';

export function generateStaticParams() {
  return LOCATION_STATIC_PARAMS;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoomItemDetailsPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">Loading...</div>}>
      <RoomItemDetailsClient id={id} />
    </Suspense>
  );
}

