import type { ConfirmedOcrTransactionRequest } from "./types";

function isValidPayload(payload: unknown): payload is ConfirmedOcrTransactionRequest {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const value = payload as Partial<ConfirmedOcrTransactionRequest>;
  return Boolean(
    value.merchant_name &&
      value.transaction_datetime &&
      value.currency &&
      typeof value.total_amount === "number" &&
      value.wallet_id &&
      value.final_category &&
      value.original_suggested_category
  );
}

export async function createMockConfirmedTransactionHandler(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!isValidPayload(payload)) {
    return new Response(
      JSON.stringify({
        error_code: "INVALID_PAYLOAD",
        message: "Confirmed OCR payload is missing required fields."
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" }
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      transaction_id: `mock-transaction-${Date.now()}`
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" }
    }
  );
}
