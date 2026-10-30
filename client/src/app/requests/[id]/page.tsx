import { mockPurchaseRequests } from '@/data/mockData';
import RequestDetailsClient from './RequestDetailsClient';

export function generateStaticParams() {
  return mockPurchaseRequests.map((req) => ({
    id: req.id,
  }));
}

export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseRequestDetailsPage({ params }: Props) {
  const { id } = await params;
  return <RequestDetailsClient id={id} />;
}

