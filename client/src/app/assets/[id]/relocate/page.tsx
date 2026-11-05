import AssetRelocateClient from './AssetRelocateClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AssetRelocatePage({ params }: Props) {
  const { id } = await params;
  return <AssetRelocateClient id={id} />;
}

