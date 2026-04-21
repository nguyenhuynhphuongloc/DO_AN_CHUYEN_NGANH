import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReceiptOcrModule } from "../src/receipt-ocr/ReceiptOcrModule";
import { createMockConfirmedTransactionHandler } from "../src/receipt-ocr/mockConfirmedTransaction";
import type {
  ConfirmedOcrTransactionRequest,
  OcrSuccessResponse,
  WalletOption
} from "../src/receipt-ocr/types";

const OCR_RESPONSE: OcrSuccessResponse = {
  total_amount: 150000,
  currency: "VND",
  transaction_datetime: "2023-10-25T14:30:00Z",
  merchant_name: "Highlands Coffee",
  payment_method: "Credit Card",
  ai_suggested_category: "Ăn uống"
};

const WALLETS: WalletOption[] = [
  {
    id: "wallet-1",
    name: "Cash Wallet",
    currency: "VND",
    balance: 1000000,
    is_default: true
  }
];

describe("ReceiptOcrModule", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:preview")
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn()
    });
  });

  it("completes the OCR flow and submits a confirmed transaction", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input) === "/api/ocr") {
        return new Response(JSON.stringify(OCR_RESPONSE), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      const body = JSON.parse(String(init?.body)) as ConfirmedOcrTransactionRequest;
      expect(body.wallet_id).toBe("wallet-1");
      expect(body.final_category).toBe("Di chuyển");
      expect(body.notes).toBe("Taxi to client meeting");
      expect(body.original_suggested_category).toBe("Ăn uống");
      expect((init?.headers as Record<string, string>)["x-user-id"]).toBe("user-1");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Confirmed OCR transaction saved.",
          transaction_id: "transaction-123",
          data: {
            transaction: {
              id: "transaction-123",
              user_id: "user-1",
              wallet_id: "wallet-1",
              category_id: "category-1",
              amount: 150000,
              currency: "VND",
              transaction_type: "expense",
              note: body.notes,
              merchant_name: body.merchant_name,
              transaction_date: body.transaction_datetime,
              payment_method: "credit_card",
              source_type: "receipt",
              source_ref_id: null,
              receipt_reference: body.original_suggested_category,
              created_at: "2026-04-21T08:00:00.000Z",
              updated_at: "2026-04-21T08:00:00.000Z"
            },
            wallet_balance: 850000,
            budget: null
          }
        }),
        {
          status: 201,
          headers: { "content-type": "application/json" }
        }
      );
    });

    render(
      <ReceiptOcrModule
        ocrEndpoint="/api/ocr"
        saveEndpoint="/api/transactions/confirmed-ocr"
        fetchImpl={fetchMock}
        walletOptions={WALLETS}
        categoryOptions={["Ăn uống", "Di chuyển"]}
        saveRequestHeaders={{ "x-user-id": "user-1" }}
      />
    );

    const file = new File(["receipt"], "receipt.png", { type: "image/png" });
    const uploadInput = screen.getByLabelText(/choose a receipt image/i);
    fireEvent.change(uploadInput, { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /run ocr/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Highlands Coffee")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/^category$/i), "Di chuyển");
    await user.type(screen.getByLabelText(/notes/i), "Taxi to client meeting");
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(screen.getByText("Confirmed OCR transaction saved.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows backend OCR errors to the user", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          error_code: "BLURRY_IMAGE",
          message: "The receipt image is too blurry to read."
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" }
        }
      )
    );

    render(
      <ReceiptOcrModule
        ocrEndpoint="/api/ocr"
        saveEndpoint="/api/transactions/confirmed-ocr"
        fetchImpl={fetchMock}
        walletOptions={WALLETS}
      />
    );

    const file = new File(["receipt"], "receipt.png", { type: "image/png" });
    const uploadInput = screen.getByLabelText(/choose a receipt image/i);
    fireEvent.change(uploadInput, { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /run ocr/i }));

    await waitFor(() => {
      expect(screen.getByText("The receipt image is too blurry to read.")).toBeInTheDocument();
    });
  });

  it("shows save errors with the structured message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input) === "/api/ocr") {
        return new Response(JSON.stringify(OCR_RESPONSE), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(
        JSON.stringify({
          error_code: "WALLET_NOT_FOUND",
          message: "wallet_id does not belong to the current user."
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" }
        }
      );
    });

    render(
      <ReceiptOcrModule
        ocrEndpoint="/api/ocr"
        saveEndpoint="/api/transactions/confirmed-ocr"
        fetchImpl={fetchMock}
        walletOptions={WALLETS}
      />
    );

    const file = new File(["receipt"], "receipt.png", { type: "image/png" });
    const uploadInput = screen.getByLabelText(/choose a receipt image/i);
    fireEvent.change(uploadInput, { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /run ocr/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Highlands Coffee")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(screen.getByText("wallet_id does not belong to the current user.")).toBeInTheDocument();
    });
  });
});

describe("createMockConfirmedTransactionHandler", () => {
  it("returns a structured simulated transaction response", async () => {
    const request = new Request("http://localhost/api/transactions/confirmed-ocr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...OCR_RESPONSE,
        wallet_id: "wallet-1",
        final_category: "Ăn uống",
        notes: "Business coffee",
        original_suggested_category: "Ăn uống"
      } satisfies ConfirmedOcrTransactionRequest)
    });

    const response = await createMockConfirmedTransactionHandler(request);
    const payload = (await response.json()) as { success: boolean; transaction_id: string };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.transaction_id).toMatch(/^mock-transaction-/);
  });

  it("returns a structured error for invalid save payloads", async () => {
    const request = new Request("http://localhost/api/transactions/confirmed-ocr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchant_name: "Highlands Coffee"
      })
    });

    const response = await createMockConfirmedTransactionHandler(request);
    const payload = (await response.json()) as { error_code: string; message: string };

    expect(response.status).toBe(400);
    expect(payload.error_code).toBe("INVALID_PAYLOAD");
    expect(payload.message).toBe("Confirmed OCR payload is missing required fields.");
  });
});
