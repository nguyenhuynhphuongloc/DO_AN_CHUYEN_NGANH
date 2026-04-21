import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "backend", "receipt-ocr");

async function readJson(path) {
  const content = await readFile(resolve(ROOT, path), "utf8");
  return JSON.parse(content);
}

function assertSuccessSchema(payload) {
  for (const key of [
    "total_amount",
    "currency",
    "transaction_datetime",
    "merchant_name",
    "payment_method",
    "ai_suggested_category"
  ]) {
    assert.ok(key in payload, `Missing success field: ${key}`);
  }

  assert.equal(typeof payload.total_amount, "number");
  assert.equal(typeof payload.currency, "string");
  assert.equal(typeof payload.transaction_datetime, "string");
  assert.equal(typeof payload.merchant_name, "string");
  assert.equal(typeof payload.payment_method, "string");
  assert.equal(typeof payload.ai_suggested_category, "string");
}

function assertErrorSchema(payload, expectedCode) {
  assert.equal(payload.error_code, expectedCode);
  assert.equal(typeof payload.message, "string");
}

const workflow = await readJson("workflows/receipt-ocr-workflow.json");
const successFixture = await readJson("fixtures/ocr-success.json");
const blurryFixture = await readJson("fixtures/ocr-blurry-error.json");
const insufficientFixture = await readJson("fixtures/ocr-insufficient-data-error.json");

assert.equal(workflow.name, "Receipt OCR Webhook");
assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length >= 5, "Workflow nodes missing");

const nodeNames = workflow.nodes.map((node) => node.name);
for (const requiredName of [
  "Receipt OCR Webhook",
  "Validate Receipt Upload",
  "Veryfi OCR Request",
  "Normalize OCR Response",
  "Respond Success",
  "Respond OCR Error"
]) {
  assert.ok(nodeNames.includes(requiredName), `Workflow is missing node: ${requiredName}`);
}

assertSuccessSchema(successFixture);
assertErrorSchema(blurryFixture, "BLURRY_IMAGE");
assertErrorSchema(insufficientFixture, "INSUFFICIENT_DATA");

console.log("Backend OCR smoke checks passed.");
