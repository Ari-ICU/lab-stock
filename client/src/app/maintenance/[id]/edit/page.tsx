import MaintenanceEditClient from './MaintenanceEditClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MaintenanceEditPage({ params }: Props) {
  const { id } = await params;
  return <MaintenanceEditClient id={id} />;
}

