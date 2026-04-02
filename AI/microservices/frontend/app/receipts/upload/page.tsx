'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Shell } from '@/components/shell';
import { uploadReceipt } from '@/lib/api';
import { getAccessToken, MissingAuthSessionError } from '@/lib/auth-storage';

export default function UploadReceiptPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Choose a receipt image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const receipt = await uploadReceipt(file);
      router.push(`/receipts/${receipt.receipt.id}/review`);
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Receipt upload</p>
        <h2 className="mt-2 text-3xl font-semibold">Send a receipt to the extraction pipeline</h2>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <span className="block text-lg font-medium">Choose an image file</span>
            <span className="mt-2 block text-sm text-neutral-500">PNG, JPG, or any file for placeholder parsing.</span>
            <input
              className="mt-4 block w-full"
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload receipt'}
          </button>
        </form>
      </section>
    </Shell>
  );
}
