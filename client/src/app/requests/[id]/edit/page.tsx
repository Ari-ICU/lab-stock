import { mockPurchaseRequests } from '@/data/mockData';
import EditRequestClient from './EditRequestClient';

export function generateStaticParams() {
  return mockPurchaseRequests.map((req) => ({
    id: req.id,
  }));
}

export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPurchaseRequestPage({ params }: Props) {
  const { id } = await params;
  return <EditRequestClient id={id} />;
}

