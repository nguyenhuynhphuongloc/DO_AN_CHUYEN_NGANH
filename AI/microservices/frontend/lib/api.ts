import { requireAccessToken } from './auth-storage';
import { AuthResponse, Category, DashboardSummary, ReceiptStructuredExtraction, ReceiptWorkflow, Transaction, Wallet } from './types';

function resolveApiUrl(publicUrl: string | undefined, internalUrl: string | undefined, fallback: string) {
  if (typeof window === 'undefined') {
    return internalUrl ?? publicUrl ?? fallback;
  }

  return publicUrl ?? fallback;
}

const authApiUrl = resolveApiUrl(
  process.env.NEXT_PUBLIC_AUTH_API_URL,
  process.env.INTERNAL_AUTH_API_URL,
  'http://localhost:8001',
);
const financeApiUrl = resolveApiUrl(
  process.env.NEXT_PUBLIC_FINANCE_API_URL,
  process.env.INTERNAL_FINANCE_API_URL,
  'http://localhost:8002',
);
const receiptApiUrl = resolveApiUrl(
  process.env.NEXT_PUBLIC_RECEIPT_API_URL,
  process.env.INTERNAL_RECEIPT_API_URL,
  'http://localhost:8003',
);

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    try {
      const payload = JSON.parse(message) as { message?: string; detail?: string };
      throw new Error(payload.detail ?? payload.message ?? (message || 'Request failed'));
    } catch {
      throw new Error(message || 'Request failed');
    }
  }

  return (await response.json()) as T;
}

function createHeaders(
  headers?: HeadersInit,
  options?: {
    json?: boolean;
    auth?: boolean;
  },
) {
  const nextHeaders = new Headers(headers);

  if (options?.json) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  if (options?.auth) {
    nextHeaders.set('Authorization', `Bearer ${requireAccessToken()}`);
  }

  return nextHeaders;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${authApiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return parseJson<AuthResponse>(response);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${financeApiUrl}/dashboard/summary`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<DashboardSummary>(response);
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${financeApiUrl}/transactions`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<Transaction[]>(response);
}

export async function getWallets(): Promise<Wallet[]> {
  const response = await fetch(`${financeApiUrl}/wallets`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<Wallet[]>(response);
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${financeApiUrl}/categories`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<Category[]>(response);
}

export async function uploadReceipt(file: File): Promise<ReceiptWorkflow> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${receiptApiUrl}/receipts/upload`, {
    method: 'POST',
    body: formData,
    headers: createHeaders(undefined, { auth: true }),
  });

  return parseJson<ReceiptWorkflow>(response);
}

export async function getReceipt(id: string): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/${id}`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<ReceiptWorkflow>(response);
}

export async function getReceiptSession(id: string): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/sessions/${id}`, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });
  return parseJson<ReceiptWorkflow>(response);
}

export async function parseReceipt(id: string, options?: { force?: boolean }) {
  const searchParams = new URLSearchParams();
  if (options?.force) {
    searchParams.set('force', 'true');
  }

  const response = await fetch(`${receiptApiUrl}/receipts/${id}/parse${searchParams.size ? `?${searchParams}` : ''}`, {
    method: 'POST',
    headers: createHeaders(undefined, { auth: true }),
  });

  return parseJson<{ receipt: ReceiptWorkflow; extracted_fields: ReceiptStructuredExtraction | Record<string, unknown> | null }>(response);
}

export async function parseReceiptSession(id: string, options?: { force?: boolean }) {
  const searchParams = new URLSearchParams();
  if (options?.force) {
    searchParams.set('force', 'true');
  }

  const response = await fetch(`${receiptApiUrl}/receipts/sessions/${id}/parse${searchParams.size ? `?${searchParams}` : ''}`, {
    method: 'POST',
    headers: createHeaders(undefined, { auth: true }),
  });

  return parseJson<{ receipt: ReceiptWorkflow; extracted_fields: ReceiptStructuredExtraction | Record<string, unknown> | null }>(response);
}

export async function saveReceiptFeedback(
  id: string,
  payload: {
    feedback?: string;
    merchant_name?: string;
    transaction_date?: string;
    total_amount?: number;
    tax_amount?: number;
    currency?: string;
  },
): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/${id}/feedback`, {
    method: 'POST',
    headers: createHeaders(undefined, { json: true, auth: true }),
    body: JSON.stringify(payload),
  });

  return parseJson<ReceiptWorkflow>(response);
}

export async function saveReceiptSessionFeedback(
  id: string,
  payload: {
    feedback?: string;
    merchant_name?: string;
    transaction_date?: string;
    total_amount?: number;
    tax_amount?: number;
    currency?: string;
  },
): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/sessions/${id}/feedback`, {
    method: 'POST',
    headers: createHeaders(undefined, { json: true, auth: true }),
    body: JSON.stringify(payload),
  });

  return parseJson<ReceiptWorkflow>(response);
}

export async function confirmReceipt(
  id: string,
  payload: {
    wallet_id: string;
    category_id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    merchant_name?: string;
    transaction_date: string;
  },
): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/${id}/confirm`, {
    method: 'POST',
    headers: createHeaders(undefined, { json: true, auth: true }),
    body: JSON.stringify(payload),
  });

  return parseJson<ReceiptWorkflow>(response);
}

export async function confirmReceiptSession(
  id: string,
  payload: {
    wallet_id: string;
    category_id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    merchant_name?: string;
    transaction_date: string;
  },
): Promise<ReceiptWorkflow> {
  const response = await fetch(`${receiptApiUrl}/receipts/sessions/${id}/confirm`, {
    method: 'POST',
    headers: createHeaders(undefined, { json: true, auth: true }),
    body: JSON.stringify(payload),
  });

  return parseJson<ReceiptWorkflow>(response);
}

export async function getReceiptArtifactBlob(url: string): Promise<Blob> {
  const absoluteUrl = url.startsWith('http') ? url : `${receiptApiUrl}${url}`;
  const response = await fetch(absoluteUrl, {
    cache: 'no-store',
    headers: createHeaders(undefined, { auth: true }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.blob();
}
