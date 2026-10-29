import { mockLoans } from '@/data/mockData';
import LoanDetailsClient from './LoanDetailsClient';

export function generateStaticParams() {
  return mockLoans.map((loan) => ({
    id: loan.id,
  }));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LoanDetailPage({ params }: Props) {
  const { id } = await params;
  return <LoanDetailsClient id={id} />;
}

