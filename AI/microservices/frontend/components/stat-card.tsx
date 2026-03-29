type Props = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm">
      <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
