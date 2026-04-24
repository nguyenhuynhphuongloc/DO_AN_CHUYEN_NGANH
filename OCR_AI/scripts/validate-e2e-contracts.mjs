import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();

async function readJson(relativePath) {
  const content = await readFile(resolve(ROOT, relativePath), "utf8");
  return JSON.parse(content);
}

function expectKeys(payload, keys, label) {
  for (const key of keys) {
    assert.ok(key in payload, `${label} is missing key: ${key}`);
  }
}

const ocrSuccess = await readJson("contracts/ocr-success.json");
const ocrError = await readJson("contracts/ocr-error.json");
const confirmedOcrRequest = await readJson("contracts/confirmed-ocr-transaction-request.json");
const confirmedOcrResponse = await readJson("contracts/confirmed-ocr-transaction-response.json");
const serviceError = await readJson("contracts/service-error.json");
const backendSuccess = await readJson("backend/receipt-ocr/fixtures/ocr-success.json");
const backendBlurry = await readJson("backend/receipt-ocr/fixtures/ocr-blurry-error.json");
const financeConfirmedOcrResponse = await readJson(
  "microservices/finance-service/fixtures/confirmed-ocr-response.json"
);
const financeServiceError = await readJson("microservices/finance-service/fixtures/service-error.json");

const canonicalOcrKeys = [
  "merchant_name",
  "transaction_datetime",
  "total_amount",
  "tax_amount",
  "currency",
  "payment_method",
  "ai_suggested_category",
  "ai_suggested_category_id",
  "warnings",
  "needs_review"
];

assert.equal(ocrSuccess.mode, "ocr_form");
expectKeys(ocrSuccess, ["mode", "receipt_data"], "contracts/ocr-success.json");
expectKeys(ocrSuccess.receipt_data, canonicalOcrKeys, "contracts/ocr-success.json:receipt_data");
expectKeys(
  confirmedOcrRequest,
  [
    "total_amount",
    "currency",
    "transaction_datetime",
    "merchant_name",
    "payment_method",
    "ai_suggested_category",
    "wallet_id",
    "final_category",
    "notes",
    "original_suggested_category"
  ],
  "contracts/confirmed-ocr-transaction-request.json"
);
expectKeys(
  confirmedOcrResponse,
  ["success", "message", "transaction_id", "data"],
  "contracts/confirmed-ocr-transaction-response.json"
);
expectKeys(
  confirmedOcrResponse.data,
  ["transaction", "wallet_balance", "budget"],
  "contracts/confirmed-ocr-transaction-response.json:data"
);
expectKeys(ocrError, ["error_code", "message"], "contracts/ocr-error.json");
expectKeys(serviceError, ["error_code", "message"], "contracts/service-error.json");

assert.deepEqual(
  backendSuccess,
  ocrSuccess,
  "Backend OCR fixture drifted from canonical OCR success contract"
);
assert.deepEqual(
  backendBlurry,
  ocrError,
  "Backend blurry error fixture drifted from canonical OCR error contract"
);
assert.deepEqual(
  financeConfirmedOcrResponse,
  confirmedOcrResponse,
  "Finance confirmed OCR fixture drifted from canonical finance response contract"
);
assert.deepEqual(
  financeServiceError,
  serviceError,
  "Finance service error fixture drifted from canonical service error contract"
);

assert.equal(typeof ocrSuccess.receipt_data.total_amount, "number");
assert.equal(typeof confirmedOcrRequest.wallet_id, "string");
assert.equal(typeof confirmedOcrRequest.final_category, "string");
assert.equal(
  confirmedOcrRequest.ai_suggested_category,
  confirmedOcrRequest.original_suggested_category
);
assert.equal(confirmedOcrResponse.data.transaction.transaction_type, "expense");
assert.equal(confirmedOcrResponse.data.transaction.source_type, "receipt");

console.log("End-to-end contract validation passed.");
