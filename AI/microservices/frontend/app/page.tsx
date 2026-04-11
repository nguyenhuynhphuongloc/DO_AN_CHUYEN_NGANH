import Link from 'next/link';
import { Shell } from '@/components/shell';

export default function HomePage() {
  return (
    <Shell>
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-sm lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Capstone starter</p>
          <h2 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
            Track wallets, upload receipts, and move from mock OCR to confirmed transactions.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-neutral-600">
            This MVP keeps the architecture intentionally simple: Next.js in front, separate auth and
            finance services, and a receipt service that stores uploads and scaffolds extraction.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/receipts/upload"
              className="rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent"
            >
              Upload a receipt
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-ink p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-200">Included now</p>
          <ul className="mt-5 space-y-4 text-sm text-neutral-200">
            <li>JWT login against the NestJS auth service</li>
            <li>Wallets, categories, transactions, and dashboard summary</li>
            <li>Receipt upload, parse, review, feedback, and confirmation flow</li>
          </ul>
        </div>
      </section>
    </Shell>
  );
}
