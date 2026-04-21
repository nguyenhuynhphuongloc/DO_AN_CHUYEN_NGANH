import type {
  ConfirmedOcrTransactionRequest,
  ConfirmedOcrTransactionResponse,
  OcrErrorResponse
} from "./types";

function validateConfirmedTransactionPayload(
  payload: unknown
): payload is ConfirmedOcrTransactionRequest {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ConfirmedOcrTransactionRequest>;
  return (
    typeof candidate.total_amount === "number" &&
    typeof candidate.currency === "string" &&
    typeof candidate.transaction_datetime === "string" &&
    typeof candidate.merchant_name === "string" &&
    typeof candidate.payment_method === "string" &&
    typeof candidate.ai_suggested_category === "string" &&
    typeof candidate.wallet_id === "string" &&
    typeof candidate.original_suggested_category === "string" &&
    typeof candidate.final_category === "string" &&
    typeof candidate.notes === "string"
  );
}

export function createMockTransactionId() {
  return `mock-transaction-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildMockConfirmedTransactionSuccess(
  payload: ConfirmedOcrTransactionRequest
): ConfirmedOcrTransactionResponse {
  const transactionId = createMockTransactionId();

  return {
    success: true,
    message: "Confirmed OCR transaction saved.",
    transaction_id: transactionId,
    data: {
      transaction: {
        id: transactionId,
        user_id: "mock-user-id",
        wallet_id: payload.wallet_id,
        category_id: payload.category_id ?? null,
        amount: payload.total_amount,
        currency: payload.currency,
        transaction_type: "expense",
        note: payload.notes,
        merchant_name: payload.merchant_name,
        transaction_date: payload.transaction_datetime,
        payment_method: payload.payment_method,
        source_type: "receipt",
        source_ref_id: null,
        receipt_reference: payload.original_suggested_category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      wallet_balance: null,
      budget: null
    }
  };
}

export function buildMockConfirmedTransactionError(
  status: number,
  error_code: string,
  message: string
): Response {
  const body: OcrErrorResponse = { error_code, message };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

export async function createMockConfirmedTransactionHandler(request: Request): Promise<Response> {
  if (request.method.toUpperCase() !== "POST") {
    return buildMockConfirmedTransactionError(405, "METHOD_NOT_ALLOWED", "Only POST is supported.");
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return buildMockConfirmedTransactionError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON."
    );
  }

  if (!validateConfirmedTransactionPayload(payload)) {
    return buildMockConfirmedTransactionError(
      400,
      "INVALID_PAYLOAD",
      "Confirmed OCR payload is missing required fields."
    );
  }

  const response = buildMockConfirmedTransactionSuccess(payload);

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "content-type": "application/json"
    }
  });
}
