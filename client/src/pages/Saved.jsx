import { Heart } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/misc';
import { useWishlistQuery } from '../store/api';

export default function Saved() {
  const { data = [], isLoading } = useWishlistQuery();
  return (
    <PageShell title="Saved stays" description="Tap the heart on any room to keep it here.">
      {isLoading ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <RoomCardSkeleton key={i} />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" description="Build your shortlist while you browse and come back when you're ready to book." action={<Button to="/rooms">Find stays</Button>} />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)}
        </div>
      )}
    </PageShell>
  );
}
