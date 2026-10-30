import { mockAssets } from '@/data/mockData';
import EditAssetClient from './EditAssetClient';

export function generateStaticParams() {
  return mockAssets.map((asset) => ({
    id: asset.id,
  }));
}

export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAssetPage({ params }: Props) {
  const { id } = await params;
  return <EditAssetClient id={id} />;
}
