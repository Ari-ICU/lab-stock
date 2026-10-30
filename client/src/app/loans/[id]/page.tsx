import { mockLoans } from '@/data/mockData';
import LoanDetailsClient from './LoanDetailsClient';

export function generateStaticParams() {
  return mockLoans.map((loan) => ({
    id: loan.id,
  }));
}

export const dynamicParams =
  process.env.NODE_ENV === 'production' &&
  (process.env.GITHUB_ACTIONS === 'true' || process.env.NEXT_EXPORT === 'true')
    ? false
    : true;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LoanDetailPage({ params }: Props) {
  const { id } = await params;
  return <LoanDetailsClient id={id} />;
}

