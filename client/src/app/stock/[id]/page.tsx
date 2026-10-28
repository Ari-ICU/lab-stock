import { mockStock } from '@/data/mockData';
import StockDetailsClient from './StockDetailsClient';

export function generateStaticParams() {
  return mockStock.map((item) => ({
    id: item.id,
  }));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StockItemPage({ params }: Props) {
  const { id } = await params;
  return <StockDetailsClient id={id} />;
}

