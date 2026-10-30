import AssetDetailsClient from './AssetDetailsClient';

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AssetPage({ params }: Props) {
  const { id } = await params;
  return <AssetDetailsClient id={id} />;
}
