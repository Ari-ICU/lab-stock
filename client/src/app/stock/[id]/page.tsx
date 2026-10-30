import { mockStock } from '@/data/mockData';
import StockDetailsClient from './StockDetailsClient';

export function generateStaticParams() {
  const ids = new Set<string>();
  mockStock.forEach((item) => {
    ids.add(item.id);
  });
  ids.add('bdc36707-5f43-4932-9f92-41019b35fee0');
  return Array.from(ids).map((id) => ({ id }));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StockItemPage({ params }: Props) {
  const { id } = await params;
  return <StockDetailsClient id={id} />;
}

