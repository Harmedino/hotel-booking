import Skeleton from '../ui/Skeleton';

export function PageLoader() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}
