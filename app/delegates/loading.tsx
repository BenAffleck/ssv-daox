import DelegatesTableSkeleton from '@/components/dao-delegates/DelegatesTableSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <div className="mb-2 h-8 w-64 animate-pulse rounded bg-muted/30" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted/20" />
      </div>

      <DelegatesTableSkeleton />
    </div>
  );
}
