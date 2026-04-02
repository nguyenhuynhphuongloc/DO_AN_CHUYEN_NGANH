'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ReceiptOcrDebugPanel } from '@/components/receipt-ocr-debug-panel';
import { Shell } from '@/components/shell';
import { confirmReceipt, getCategories, getReceipt, getWallets, parseReceipt, saveReceiptFeedback } from '@/lib/api';
import { MissingAuthSessionError } from '@/lib/auth-storage';
import { Category, Receipt, Wallet } from '@/lib/types';

export default function ReceiptReviewPage() {
  const showOcrDebug = true;
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receiptId = params.id;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('0');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Loading receipt...');
  const [error, setError] = useState('');

  function syncFromReceipt(receiptData: Receipt) {
    const extraction = receiptData.extraction_result;
    setReceipt(receiptData);
    setMerchantName(extraction?.merchant_name ?? '');
    setAmount(String(extraction?.total_amount ?? 0));
    setTransactionDate(
      extraction?.transaction_date
        ? new Date(`${extraction.transaction_date}T00:00:00`).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    );
    setFeedback(receiptData.latest_feedback?.feedback_note ?? '');
  }

  useEffect(() => {
    async function load() {
      try {
        const [receiptData, walletData, categoryData] = await Promise.all([
          getReceipt(receiptId),
          getWallets(),
          getCategories(),
        ]);
        syncFromReceipt(receiptData);
        setWallets(walletData);
        setCategories(categoryData);
        setWalletId(walletData[0]?.id ?? '');
        setCategoryId(categoryData[0]?.id ?? '');
        setStatus('Receipt loaded');
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load receipt');
      }
    }

    void load();
  }, [receiptId, router]);

  async function handleParse() {
    setStatus('Parsing receipt...');
    setError('');
    try {
      const payload = await parseReceipt(receiptId);
      syncFromReceipt(payload.receipt);
      setMerchantName(String(payload.extracted_fields.merchant_name ?? ''));
      setAmount(String(payload.extracted_fields.total_amount ?? 0));
      setTransactionDate(new Date(String(payload.extracted_fields.transaction_date)).toISOString().slice(0, 16));
      setStatus('OCR parsing complete');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to parse receipt');
    }
  }

  async function handleFeedback() {
    try {
      const updated = await saveReceiptFeedback(receiptId, {
        feedback,
        merchant_name: merchantName,
        transaction_date: new Date(transactionDate).toISOString(),
        total_amount: Number(amount),
        currency: receipt?.extraction_result?.currency ?? 'VND',
      });
      syncFromReceipt(updated);
      setStatus('Feedback saved');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to save feedback');
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Confirming receipt...');
    setError('');

    try {
      const updated = await confirmReceipt(receiptId, {
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: Number(amount),
        description,
        merchant_name: merchantName,
        transaction_date: new Date(transactionDate).toISOString(),
      });
      syncFromReceipt(updated);
      setStatus(updated.finance_warning ?? 'Receipt confirmed and transaction created');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to confirm receipt');
    }
  }

  return (
    <Shell>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <aside className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Receipt details</p>
          <h2 className="mt-2 text-2xl font-semibold break-words max-w-full">
             {receipt?.receipt.file_name ?? 'Loading...'}
          </h2>
          <p className="mt-4 text-sm text-neutral-600">Status: {receipt?.receipt.status ?? 'unknown'}</p>
          <p className="mt-2 text-sm text-neutral-600">{status}</p>
          {receipt?.finance_transaction_id ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Created finance transaction: {receipt.finance_transaction_id}
            </p>
          ) : null}
          {receipt?.finance_warning ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {receipt.finance_warning}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleParse}
            className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Run OCR parse
          </button>
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>OCR provider: {receipt?.ocr_result?.ocr_provider ?? 'Not parsed yet'}</p>
            <p>Review status: {receipt?.extraction_result?.review_status ?? 'Not parsed yet'}</p>
          </div>
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">Feedback</label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Describe any extraction issues here"
            />
            <button
              type="button"
              onClick={handleFeedback}
              className="mt-3 rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent"
            >
              Save feedback
            </button>
          </div>
        </aside>

        <form onSubmit={handleConfirm} className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Review extraction</p>
          <h2 className="mt-2 text-2xl font-semibold">Edit and confirm the transaction</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Merchant name</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Amount</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Transaction date</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                type="datetime-local"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Type</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={type}
                onChange={(event) => setType(event.target.value as 'INCOME' | 'EXPENSE')}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Wallet</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={walletId}
                onChange={(event) => setWalletId(event.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Category</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Confirm receipt
          </button>
        </form>

        {showOcrDebug ? <ReceiptOcrDebugPanel ocrDebug={receipt?.ocr_debug ?? null} /> : null}
      </section>
    </Shell>
  );
}
