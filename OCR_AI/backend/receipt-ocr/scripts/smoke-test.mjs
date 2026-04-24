import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "backend", "receipt-ocr");

async function readJson(path) {
  const content = await readFile(resolve(ROOT, path), "utf8");
  return JSON.parse(content);
}

function assertSuccessSchema(payload) {
  assert.equal(payload.mode, "ocr_form");
  assert.ok(payload.receipt_data && typeof payload.receipt_data === "object");
  for (const key of [
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
  ]) {
    assert.ok(key in payload.receipt_data, `Missing success field: ${key}`);
  }

  assert.equal(typeof payload.receipt_data.total_amount, "number");
  assert.equal(typeof payload.receipt_data.currency, "string");
  assert.equal(typeof payload.receipt_data.transaction_datetime, "string");
  assert.equal(typeof payload.receipt_data.merchant_name, "string");
  assert.equal(typeof payload.receipt_data.payment_method, "string");
  assert.ok(Array.isArray(payload.receipt_data.warnings));
  assert.equal(typeof payload.receipt_data.needs_review, "boolean");
}

function assertErrorSchema(payload, expectedCode) {
  assert.equal(payload.error_code, expectedCode);
  assert.equal(typeof payload.message, "string");
}

const formWorkflow = await readJson("workflows/receipt-ocr-workflow.json");
const coreWorkflow = await readJson("workflows/receipt-ocr-core-workflow.json");
const chatbotWorkflow = await readJson("workflows/receipt-ocr-chatbot-workflow.json");
const successFixture = await readJson("fixtures/ocr-success.json");
const blurryFixture = await readJson("fixtures/ocr-blurry-error.json");
const insufficientFixture = await readJson("fixtures/ocr-insufficient-data-error.json");

assert.equal(formWorkflow.name, "Receipt OCR Form Endpoint");
assert.equal(coreWorkflow.name, "Receipt OCR Core");
assert.equal(chatbotWorkflow.name, "Receipt OCR Chatbot Endpoint");
assert.ok(Array.isArray(formWorkflow.nodes) && formWorkflow.nodes.length >= 5, "Form workflow nodes missing");
assert.ok(Array.isArray(coreWorkflow.nodes) && coreWorkflow.nodes.length >= 8, "Core workflow nodes missing");
assert.ok(Array.isArray(chatbotWorkflow.nodes) && chatbotWorkflow.nodes.length >= 5, "Chatbot workflow nodes missing");

const formNodeNames = formWorkflow.nodes.map((node) => node.name);
const coreNodeNames = coreWorkflow.nodes.map((node) => node.name);
const chatbotNodeNames = chatbotWorkflow.nodes.map((node) => node.name);
for (const requiredName of [
  "Receipt OCR Form Webhook",
  "Prepare Request For Core",
  "Execute Receipt OCR Core",
  "Build OCR Form Response",
  "Respond To Webhook"
]) {
  assert.ok(formNodeNames.includes(requiredName), `Form workflow is missing node: ${requiredName}`);
}
for (const requiredName of [
  "Execute Sub-workflow Trigger",
  "Validate OCR Core Request",
  "Veryfi Process Document",
  "Normalize OCR Result",
  "Match User Category",
  "Return Structured OCR Data"
]) {
  assert.ok(coreNodeNames.includes(requiredName), `Core workflow is missing node: ${requiredName}`);
}
for (const requiredName of [
  "Receipt OCR Chatbot Webhook",
  "Prepare Request For Core",
  "Execute Receipt OCR Core",
  "Build Chatbot OCR Response",
  "Respond To Webhook"
]) {
  assert.ok(chatbotNodeNames.includes(requiredName), `Chatbot workflow is missing node: ${requiredName}`);
}

assertSuccessSchema(successFixture);
assertErrorSchema(blurryFixture, "BLURRY_IMAGE");
assertErrorSchema(insufficientFixture, "INSUFFICIENT_DATA");

console.log("Backend OCR smoke checks passed.");
