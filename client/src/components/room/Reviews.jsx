import { useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { useAddReviewMutation, useGetReviewsQuery, errorMessage } from '../../store/api';
import { relativeTime } from '../../lib/format';
import { Avatar, Stars, StarInput, EmptyState } from '../ui/misc';
import { Textarea } from '../ui/Field';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/Toast';

export default function Reviews({ room }) {
  const { data, isLoading } = useGetReviewsQuery(room.id);
  const [addReview, { isLoading: saving }] = useAddReviewMutation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showAll, setShowAll] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addReview({ id: room.id, rating, comment }).unwrap();
      toast.success('Thanks for your review!');
      setComment('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const total = data ? Object.values(data.breakdown).reduce((a, b) => a + b, 0) : 0;
  const items = showAll ? data?.items : data?.items.slice(0, 4);

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold text-ink">
        {room.rating ? `★ ${room.rating} · ${room.reviewCount} review${room.reviewCount === 1 ? '' : 's'}` : 'Reviews'}
      </h2>

      {room.canReview && (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-[24px] border border-brand/30 bg-brand-soft p-5">
          <p className="font-semibold text-ink">How was your stay?</p>
          <StarInput value={rating} onChange={setRating} />
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell future guests what you loved (at least 10 characters)" required minLength={10} />
          <Button loading={saving}>Post review</Button>
        </form>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : total === 0 ? (
        <EmptyState className="mt-6" icon={MessageSquareQuote} title="No reviews yet" description="Guests can review after their stay. Be the first!" />
      ) : (
        <>
          <div className="mt-6 grid max-w-md gap-1.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-3 text-muted">{s}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${(data.breakdown[s] / total) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-muted">{data.breakdown[s]}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {items.map((r) => (
              <div key={r.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={r.user.name} src={r.user.avatarUrl} />
                  <div>
                    <p className="font-semibold text-ink">{r.user.name}</p>
                    <p className="text-xs text-muted">{relativeTime(r.createdAt)}</p>
                  </div>
                </div>
                <Stars value={r.rating} className="mt-3" size="h-3.5 w-3.5" />
                <p className="mt-2 text-sm leading-6 text-ink">{r.comment}</p>
              </div>
            ))}
          </div>
          {data.items.length > 4 && (
            <Button variant="secondary" className="mt-8" onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Show fewer' : `Show all ${data.items.length} reviews`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
