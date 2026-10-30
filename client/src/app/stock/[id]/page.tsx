import StockDetailsClient from './StockDetailsClient';

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StockItemPage({ params }: Props) {
  const { id } = await params;
  return <StockDetailsClient id={id} />;
}
