import { mockAssets } from '@/data/mockData';
import AssetDetailsClient from './AssetDetailsClient';

export function generateStaticParams() {
  return mockAssets.map((asset) => ({
    id: asset.id,
  }));
}

export const dynamicParams = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AssetPage({ params }: Props) {
  const { id } = await params;
  return <AssetDetailsClient id={id} />;
}
