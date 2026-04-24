'use client';

import { ReceiptOcrDebug, ReceiptStructuredExtraction, ReceiptWorkflow } from '@/lib/types';

type ReceiptOcrTextPanelProps = {
  receipt: ReceiptWorkflow | null;
  ocrDebug: ReceiptOcrDebug | null;
  isProcessing: boolean;
  onRetryParse: () => void;
  retryDisabled: boolean;
};

function getStructuredJson(
  receipt: ReceiptWorkflow | null,
  ocrDebug: ReceiptOcrDebug | null,
): Record<string, unknown> | null {
  if (ocrDebug?.structured_json && typeof ocrDebug.structured_json === 'object') {
    return ocrDebug.structured_json;
  }
  const extractedJson = receipt?.extraction_result?.extracted_json;
  return extractedJson && typeof extractedJson === 'object' ? (extractedJson as Record<string, unknown>) : null;
}

function getParserText(
  receipt: ReceiptWorkflow | null,
  ocrDebug: ReceiptOcrDebug | null,
  structuredJson: Record<string, unknown> | null,
): string | null {
  if (ocrDebug?.raw_text) {
    return ocrDebug.raw_text;
  }
  const normalizedText = structuredJson?.normalized_text as ReceiptStructuredExtraction['normalized_text'];
  if (normalizedText?.raw_text) {
    return normalizedText.raw_text;
  }
  return receipt?.ocr_result?.raw_text ?? null;
}

export function ReceiptOcrTextPanel({ receipt, ocrDebug, isProcessing, onRetryParse, retryDisabled }: ReceiptOcrTextPanelProps) {
  const failed = receipt?.active_job?.status === 'failed';
  const structuredJson = getStructuredJson(receipt, ocrDebug);
  const parserText = getParserText(receipt, ocrDebug, structuredJson);

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Step 2</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">Parser Output</h3>
          <p className="mt-1 text-sm text-neutral-600">Đọc text parser, xem JSON cấu trúc, rồi đối chiếu với các ô thông tin đã được tự điền.</p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>Provider: {ocrDebug?.provider ?? 'Pending'}</p>
          <p>Mode: {ocrDebug?.display_mode ?? 'parser'}</p>
          <p>Document ID: {String(ocrDebug?.provider_document_id ?? 'n/a')}</p>
          <p>Confidence: {String(ocrDebug?.confidence_score ?? 'n/a')}</p>
          <p>Lines: {ocrDebug?.line_count ?? 0}</p>
        </div>
      </div>

      {isProcessing && !parserText && !structuredJson ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">Đang chờ parser hoàn tất...</p>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      ) : null}

      {!isProcessing && !failed && !parserText && !structuredJson ? (
        <p className="mt-4 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          Parser text và structured JSON sẽ xuất hiện ở đây sau khi parse hoàn tất.
        </p>
      ) : null}

      {failed ? (
        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{receipt?.active_job?.error_message ?? 'Receipt parsing failed.'}</p>
          <button
            type="button"
            className="mt-3 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
            onClick={onRetryParse}
            disabled={retryDisabled}
          >
            Retry Parse
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
            <div className="border-b border-neutral-200 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">Parser Text</p>
              <p className="mt-1 text-xs text-neutral-500">Toàn bộ text parser/OCR trả về để người dùng đọc và đối chiếu trực tiếp.</p>
            </div>
            <pre className="max-h-[30rem] overflow-auto whitespace-pre-wrap px-4 py-4 text-xs leading-6 text-neutral-800">
              {parserText ?? 'Chưa có parser text.'}
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Parser Summary</p>
            <div className="mt-3 space-y-1 text-sm text-neutral-700">
              <p>Provider: {ocrDebug?.provider ?? 'Pending'}</p>
              <p>Display mode: {ocrDebug?.display_mode ?? 'parser'}</p>
              <p>Document ID: {String(ocrDebug?.provider_document_id ?? 'n/a')}</p>
              <p>Confidence: {String(ocrDebug?.confidence_score ?? 'n/a')}</p>
              <p>Lines: {ocrDebug?.line_count ?? 0}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Structured JSON</p>
            <pre className="mt-3 max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-white bg-white px-3 py-3 text-[11px] leading-5 text-neutral-800">
              {structuredJson ? JSON.stringify(structuredJson, null, 2) : 'Chưa có JSON cấu trúc.'}
            </pre>
          </div>

          {ocrDebug?.provider_payload_summary ? (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">Provider Payload Summary</p>
              <pre className="mt-3 max-h-[12rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-white bg-white px-3 py-3 text-[11px] leading-5 text-neutral-800">
                {JSON.stringify(ocrDebug.provider_payload_summary, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
