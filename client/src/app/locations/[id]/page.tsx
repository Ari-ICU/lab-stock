import { mockLocations } from '@/data/mockData';
import LocationDetailsClient from './LocationDetailsClient';

export function generateStaticParams() {
  return mockLocations.map((loc) => ({
    id: loc.id,
  }));
}

export const dynamicParams =
  process.env.NODE_ENV === 'production' &&
  (process.env.GITHUB_ACTIONS === 'true' || process.env.NEXT_EXPORT === 'true')
    ? false
    : true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;
  return <LocationDetailsClient id={id} />;
}

