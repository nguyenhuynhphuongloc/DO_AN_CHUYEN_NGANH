import Link from 'next/link';
import { PropsWithChildren } from 'react';

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-8 rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent">Personal Finance MVP</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Receipt-aware money tracking</h1>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/login">Login</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/receipts/upload">Upload Receipt</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
