import LoanCheckoutWorkspace from '@/components/LoanCheckoutWorkspace';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StockLendPage({ params }: Props) {
  const { id } = await params;
  return <LoanCheckoutWorkspace itemId={id} itemType="stock" returnTo={`/stock/${id}`} />;
}

