import LoanDetailsClient from './LoanDetailsClient';

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LoanDetailPage({ params }: Props) {
  const { id } = await params;
  return <LoanDetailsClient id={id} />;
}
