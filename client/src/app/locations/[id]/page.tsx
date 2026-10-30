import { mockLocations } from '@/data/mockData';
import LocationDetailsClient from './LocationDetailsClient';

export function generateStaticParams() {
  return mockLocations.map((loc) => ({
    id: loc.id,
  }));
}

export const dynamicParams = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;
  return <LocationDetailsClient id={id} />;
}

