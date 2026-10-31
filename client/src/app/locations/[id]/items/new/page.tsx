import NewRoomItemClient from './NewRoomItemClient';
import { LOCATION_STATIC_PARAMS } from '../shared';

export function generateStaticParams() {
  return LOCATION_STATIC_PARAMS;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewRoomItemPage({ params }: Props) {
  const { id } = await params;
  return <NewRoomItemClient id={id} />;
}

