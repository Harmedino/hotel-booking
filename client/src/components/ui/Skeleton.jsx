import { cn } from '../../lib/cn';

export default function Skeleton({ className }) {
  return <div aria-hidden className={cn('skeleton rounded-2xl', className)} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3 rounded-full', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
