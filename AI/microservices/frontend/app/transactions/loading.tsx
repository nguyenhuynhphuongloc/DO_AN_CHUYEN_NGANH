import { Shell } from '@/components/shell';

export default function TransactionsLoading() {
  return (
    <Shell>
      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Loading</p>
        <h2 className="mt-3 text-2xl font-semibold">Fetching transactions...</h2>
      </div>
    </Shell>
  );
}
