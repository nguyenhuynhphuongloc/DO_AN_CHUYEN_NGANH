'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shell } from '@/components/shell';
import { getTransactions } from '@/lib/api';
import { MissingAuthSessionError } from '@/lib/auth-storage';
import { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTransactions() {
      try {
        setTransactions(await getTransactions());
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load transactions');
      }
    }

    void loadTransactions();
  }, [router]);

  return (
    <Shell>
      <section className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Transactions</p>
        <h2 className="mt-2 text-2xl font-semibold">All recorded entries</h2>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{transaction.type}</td>
                  <td className="px-4 py-3">{transaction.description ?? transaction.merchantName ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.wallet?.name ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.amount.toLocaleString()} VND</td>
                </tr>
              ))}
              {!transactions.length && !error ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    Loading transactions...
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
