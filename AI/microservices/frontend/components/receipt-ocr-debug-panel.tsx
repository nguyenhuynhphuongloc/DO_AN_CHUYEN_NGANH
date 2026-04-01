import { ReceiptOcrDebug } from '@/lib/types';

type ReceiptOcrDebugPanelProps = {
  ocrDebug: ReceiptOcrDebug | null;
};

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function ReceiptOcrDebugPanel({ ocrDebug }: ReceiptOcrDebugPanelProps) {
  const lineDetails = ocrDebug?.line_details ?? [];
  const normalizedLines = ocrDebug?.normalized_lines ?? [];
  const preprocessingEntries = Object.entries(ocrDebug?.preprocessing ?? {});
  const docPreprocessorEntries = Object.entries(ocrDebug?.doc_preprocessor ?? {});
  const hasDebugPayload =
    Boolean(ocrDebug?.provider) ||
    Boolean(ocrDebug?.model_lang) ||
    Boolean(ocrDebug?.model_device) ||
    preprocessingEntries.length > 0 ||
    docPreprocessorEntries.length > 0 ||
    lineDetails.length > 0;
  const hasRawText = Boolean(ocrDebug?.raw_text && ocrDebug.raw_text.trim().length > 0);

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">OCR Raw Text (Debug)</p>
      <div className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
        <p>Provider: {ocrDebug?.provider ?? 'Unknown'}</p>
        <p>Model language: {ocrDebug?.model_lang ?? 'N/A'}</p>
        <p>Model device: {ocrDebug?.model_device ?? 'N/A'}</p>
        <p>
          Confidence:{' '}
          {ocrDebug?.confidence_score !== null && ocrDebug?.confidence_score !== undefined
            ? ocrDebug.confidence_score.toFixed(4)
            : 'N/A'}
        </p>
        <p>Detected lines: {lineDetails.length}</p>
      </div>

      {hasRawText ? (
        <pre className="mt-4 max-h-80 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-950 px-4 py-4 font-mono text-xs leading-6 text-neutral-100 whitespace-pre-wrap">
          {ocrDebug?.raw_text}
        </pre>
      ) : hasDebugPayload ? (
        <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          OCR parsing finished, but no readable raw text was returned. Check the metadata below for device, preprocessing,
          and document-orientation details.
        </div>
      ) : (
        <p className="mt-4 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
          No OCR data available
        </p>
      )}

      {ocrDebug?.normalized_text ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">Normalized OCR text</p>
          <pre className="mt-2 max-h-72 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-100 px-4 py-4 font-mono text-xs leading-6 text-neutral-800 whitespace-pre-wrap">
            {ocrDebug.normalized_text}
          </pre>
        </div>
      ) : null}

      {lineDetails.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">OCR lines</p>
          <div className="mt-2 max-h-56 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <ul className="space-y-2 text-sm text-neutral-700">
              {lineDetails.map((line, index) => (
                <li key={`${index}-${line.text}`} className="font-mono text-xs leading-6">
                  <span>{line.text}</span>
                  <span className="ml-2 text-neutral-500">
                    ({line.confidence !== null && line.confidence !== undefined ? line.confidence.toFixed(4) : 'N/A'})
                  </span>
                  {line.angle !== null && line.angle !== undefined ? (
                    <span className="ml-2 text-neutral-400">angle {line.angle.toFixed(1)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {normalizedLines.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">Normalized OCR lines</p>
          <div className="mt-2 max-h-56 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <ul className="space-y-2 text-sm text-neutral-700">
              {normalizedLines.map((line, index) => (
                <li key={`${index}-${line}`} className="font-mono text-xs leading-6">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {preprocessingEntries.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">Preprocessing metadata</p>
          <div className="mt-2 max-h-56 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <ul className="space-y-2 text-xs text-neutral-700">
              {preprocessingEntries.map(([key, value]) => (
                <li key={key}>
                  <span className="font-semibold">{key}</span>: {renderValue(value)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {docPreprocessorEntries.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">Document preprocessing</p>
          <div className="mt-2 max-h-56 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <ul className="space-y-2 text-xs text-neutral-700">
              {docPreprocessorEntries.map(([key, value]) => (
                <li key={key}>
                  <span className="font-semibold">{key}</span>: {renderValue(value)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
