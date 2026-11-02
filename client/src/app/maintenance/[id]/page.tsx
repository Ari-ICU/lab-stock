import MaintenanceDetailsClient from './MaintenanceDetailsClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MaintenanceDetailsPage({ params }: Props) {
  const { id } = await params;
  return <MaintenanceDetailsClient id={id} />;
}
