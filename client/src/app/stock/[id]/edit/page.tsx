import { mockStock } from '@/data/mockData';
import EditStockClient from './EditStockClient';

export function generateStaticParams() {
  return mockStock.map((item) => ({
    id: item.id,
  }));
}

export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditStockPage({ params }: Props) {
  const { id } = await params;
  return <EditStockClient id={id} />;
}

