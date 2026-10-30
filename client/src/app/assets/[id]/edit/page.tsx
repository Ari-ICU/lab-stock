import EditAssetClient from './EditAssetClient';

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAssetPage({ params }: Props) {
  const { id } = await params;
  return <EditAssetClient id={id} />;
}
