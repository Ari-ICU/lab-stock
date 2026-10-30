import EditStockClient from './EditStockClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditStockPage({ params }: Props) {
  const { id } = await params;
  return <EditStockClient id={id} />;
}
