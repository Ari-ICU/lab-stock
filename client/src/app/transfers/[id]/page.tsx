import TransferDetailsClient from './TransferDetailsClient';

export function generateStaticParams() {
  return [{ id: '1' }, { id: 'TR-01' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TransferDetailPage({ params }: Props) {
  const { id } = await params;
  return <TransferDetailsClient id={id} />;
}

