import { badRequest, json, serverError } from "../lib/http.js";

const requiredTransactionFields = ["wallet_id", "amount", "transaction_type", "transaction_date"];
const requiredConfirmedOcrFields = [
  "total_amount",
  "currency",
  "transaction_datetime",
  "merchant_name",
  "payment_method",
  "ai_suggested_category"
];

export function createTransactionController(repository) {
  return {
    list: async (request, response) => {
      try {
        const rows = await repository.listTransactions(request.userId);
        json(response, 200, { data: rows });
      } catch (error) {
        console.error(error);
        serverError(response, "Unable to list transactions.");
      }
    },

    create: async (request, response) => {
      const missing = requiredTransactionFields.filter(
        (field) => request.body[field] === undefined || request.body[field] === ""
      );

      if (missing.length) {
        badRequest(response, "INVALID_PAYLOAD", "Missing required transaction fields.", {
          missing_fields: missing
        });
        return;
      }

      try {
        const result = await repository.createTransaction(request.userId, request.body);
        json(response, 201, result);
      } catch (error) {
        if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
          badRequest(response, "WALLET_NOT_FOUND", "wallet_id does not belong to the current user.");
          return;
        }

        console.error(error);
        serverError(response, "Unable to create transaction.");
      }
    },

    createConfirmedOcr: async (request, response) => {
      const missing = requiredConfirmedOcrFields.filter(
        (field) => request.body[field] === undefined || request.body[field] === ""
      );

      if (missing.length) {
        badRequest(response, "INVALID_PAYLOAD", "Missing required confirmed OCR fields.", {
          missing_fields: missing
        });
        return;
      }

      try {
        const result = await repository.createConfirmedOcrTransaction(request.userId, request.body, {
          walletId: request.headers["x-wallet-id"]
        });
        json(response, 201, {
          success: true,
          message: "Confirmed OCR transaction saved.",
          transaction_id: result.transaction.id,
          data: result
        });
      } catch (error) {
        if (error instanceof Error && error.message === "MISSING_WALLET_ID") {
          badRequest(
            response,
            "MISSING_WALLET_ID",
            "Provide wallet_id in the body or x-wallet-id in the request headers."
          );
          return;
        }

        if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
          badRequest(response, "WALLET_NOT_FOUND", "wallet_id does not belong to the current user.");
          return;
        }

        console.error(error);
        serverError(response, "Unable to save confirmed OCR transaction.");
      }
    }
  };
}
