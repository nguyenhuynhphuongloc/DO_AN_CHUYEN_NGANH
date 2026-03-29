import { ReceiptOcrDebug } from '@/lib/types';

type ReceiptOcrDebugPanelProps = {
  ocrDebug: ReceiptOcrDebug | null;
};

export function ReceiptOcrDebugPanel({ ocrDebug }: ReceiptOcrDebugPanelProps) {
  const lines = ocrDebug?.lines ?? [];

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">OCR Raw Text (Debug)</p>
      <div className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
        <p>Provider: {ocrDebug?.provider ?? 'Unknown'}</p>
        <p>
          Confidence:{' '}
          {ocrDebug?.confidence_score !== null && ocrDebug?.confidence_score !== undefined
            ? ocrDebug.confidence_score.toFixed(4)
            : 'N/A'}
        </p>
      </div>

      {ocrDebug?.raw_text ? (
        <pre className="mt-4 max-h-80 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-950 px-4 py-4 font-mono text-xs leading-6 text-neutral-100 whitespace-pre-wrap">
          {ocrDebug.raw_text}
        </pre>
      ) : (
        <p className="mt-4 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
          No OCR data available
        </p>
      )}

      {lines.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">OCR lines</p>
          <div className="mt-2 max-h-56 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <ul className="space-y-2 text-sm text-neutral-700">
              {lines.map((line, index) => (
                <li key={`${index}-${line}`} className="font-mono text-xs leading-6">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
