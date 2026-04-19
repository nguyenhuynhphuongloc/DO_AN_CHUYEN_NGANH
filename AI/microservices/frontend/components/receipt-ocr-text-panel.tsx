import { ReceiptOcrDebug, ReceiptWorkflow } from '@/lib/types';

type ReceiptOcrTextPanelProps = {
  receipt: ReceiptWorkflow | null;
  ocrDebug: ReceiptOcrDebug | null;
  isProcessing: boolean;
  onRetryParse: () => void;
  retryDisabled: boolean;
};

export function ReceiptOcrTextPanel({ receipt, ocrDebug, isProcessing, onRetryParse, retryDisabled }: ReceiptOcrTextPanelProps) {
  const lines = ocrDebug?.lines ?? [];
  const hasText = Boolean(ocrDebug?.raw_text && ocrDebug.raw_text.trim());
  const failed = receipt?.active_job?.status === 'failed';
  const runtime = ocrDebug?.runtime ?? null;
  const layout = ocrDebug?.layout ?? null;
  const layoutBlocks = Array.isArray(layout?.blocks) ? layout.blocks : [];
  const fieldProvenance =
    receipt?.extraction_result?.extracted_json &&
    typeof receipt.extraction_result.extracted_json === 'object' &&
    'field_provenance' in receipt.extraction_result.extracted_json
      ? (receipt.extraction_result.extracted_json.field_provenance as Record<string, unknown>)
      : null;
  const detector = String(runtime?.text_detection_model_name ?? ocrDebug?.engine_config?.text_detection_model_name ?? 'Pending');
  const recognizer = String(runtime?.text_recognition_model_name ?? ocrDebug?.engine_config?.text_recognition_model_name ?? 'Pending');
  const recognizerBackend = String(runtime?.recognizer_backend ?? ocrDebug?.engine_config?.recognizer_backend ?? 'Pending');

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Step 2</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">OCR Text</h3>
          <p className="mt-1 text-sm text-neutral-600">Secondary panel. Safe to hide in future without affecting extraction editing.</p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>Provider: {ocrDebug?.provider ?? 'Pending'}</p>
          <p>Device: {ocrDebug?.device ?? 'Pending'}</p>
          <p>Path: {ocrDebug?.selected_path ?? 'Pending'}</p>
          <p>Detector: {detector}</p>
          <p>Recognizer: {recognizer}</p>
          <p>Backend: {recognizerBackend}</p>
          <p>Layout: {String(layout?.used ?? false)}</p>
        </div>
      </div>

      {isProcessing && !hasText ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">Reading receipt text...</p>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      ) : null}

      {!isProcessing && !hasText && !failed ? (
        <p className="mt-4 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          OCR text will appear here once parsing finishes.
        </p>
      ) : null}

      {failed ? (
        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{receipt?.active_job?.error_message ?? 'OCR parsing failed.'}</p>
          <button
            type="button"
            className="mt-3 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
            onClick={onRetryParse}
            disabled={retryDisabled}
          >
            Retry OCR
          </button>
        </div>
      ) : null}

      {hasText ? (
        <pre className="mt-4 max-h-72 overflow-auto rounded-3xl border border-neutral-200 bg-neutral-950 px-4 py-4 font-mono text-xs leading-6 text-neutral-100 whitespace-pre-wrap">
          {ocrDebug?.raw_text}
        </pre>
      ) : null}

      {lines.length > 0 ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-sm font-medium text-neutral-700">Detected lines</p>
          <ul className="mt-2 max-h-44 space-y-2 overflow-auto text-xs leading-5 text-neutral-700">
            {lines.map((line, index) => (
              <li key={`${index}-${line}`} className="font-mono">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ocrDebug?.timings ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          <p className="font-medium text-neutral-900">Parse timings</p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">{JSON.stringify(ocrDebug.timings, null, 2)}</pre>
        </div>
      ) : null}

      {runtime ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          <p className="font-medium text-neutral-900">OCR runtime</p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(
              {
                actual_device: runtime.actual_device ?? ocrDebug?.device,
                requested_device: runtime.requested_device,
                compiled_with_cuda: runtime.compiled_with_cuda,
                cuda_device_count: runtime.cuda_device_count,
                detected_box_count: ocrDebug?.detected_box_count,
                line_count: ocrDebug?.line_count,
                short_line_ratio: ocrDebug?.short_line_ratio,
                image_size: ocrDebug?.preprocess?.output_size,
                row_grouping: ocrDebug?.ordering,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}

      {layout ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          <p className="font-medium text-neutral-900">Layout blocks</p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(
              {
                enabled: layout.enabled,
                used: layout.used,
                backend: layout.backend,
                fallback_reason: layout.fallback_reason,
                runtime: layout.runtime,
                blocks: layoutBlocks,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}

      {fieldProvenance ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          <p className="font-medium text-neutral-900">Field provenance</p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">{JSON.stringify(fieldProvenance, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}
