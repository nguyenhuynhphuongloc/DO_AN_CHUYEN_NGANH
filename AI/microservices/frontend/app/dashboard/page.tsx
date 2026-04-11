'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shell } from '@/components/shell';
import { StatCard } from '@/components/stat-card';
import { getDashboardSummary } from '@/lib/api';
import { MissingAuthSessionError } from '@/lib/auth-storage';
import { DashboardSummary } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummary(await getDashboardSummary());
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      }
    }

    void loadSummary();
  }, [router]);

  return (
    <Shell>
      {error ? (
        <section className="rounded-[2rem] border border-red-100 bg-red-50/90 p-6 text-sm text-red-700 shadow-sm">
          {error}
        </section>
      ) : null}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wallets" value={summary ? String(summary.walletCount) : '...'} />
        <StatCard label="Transactions" value={summary ? String(summary.transactionCount) : '...'} />
        <StatCard label="Balance" value={summary ? `${summary.totalBalance.toLocaleString()} VND` : '...'} />
        <StatCard label="Expense" value={summary ? `${summary.totalExpense.toLocaleString()} VND` : '...'} />
      </section>

      <section className="mt-8 rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Recent activity</p>
            <h2 className="mt-2 text-2xl font-semibold">Latest transactions</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Income: {summary ? `${summary.totalIncome.toLocaleString()} VND` : 'Loading...'}
          </p>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {(summary?.recentTransactions ?? []).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{transaction.merchantName ?? transaction.description ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.category?.name ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.amount.toLocaleString()} VND</td>
                </tr>
              ))}
              {!summary && !error ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={4}>
                    Loading dashboard...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
