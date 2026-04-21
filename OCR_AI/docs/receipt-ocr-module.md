# Receipt OCR Module

## Purpose

This module provides a lightweight OCR review block that can be embedded into another React application or hosted inside the protected `/ocr` page.

Workflow:

1. user uploads receipt image
2. frontend calls OCR webhook with `multipart/form-data`
3. OCR webhook returns canonical OCR fields
4. user reviews and edits values
5. user chooses a wallet and final category
6. frontend submits confirmed OCR data to `finance-service`

## Embed the component

```tsx
import { ReceiptOcrModule } from "./src/receipt-ocr";

export function ExpenseEntryPage() {
  return (
    <ReceiptOcrModule
      ocrEndpoint="http://localhost:5001/webhook/receipt-ocr"
      saveEndpoint="http://localhost:5003/transactions/confirmed-ocr"
      walletOptions={wallets}
      defaultWalletId={wallets[0]?.id}
      categoryOptions={categories.map((category) => category.name)}
      saveRequestHeaders={{
        "x-user-id": currentUserId
      }}
    />
  );
}
```

## Configurable props

- `ocrEndpoint`
- `saveEndpoint`
- `walletOptions`
- `defaultWalletId`
- `categoryOptions`
- `className`
- `ocrRequestHeaders`
- `saveRequestHeaders`
- `fetchImpl`
- `onSaveSuccess`

## Canonical contracts

- OCR success: [contracts/ocr-success.json](../contracts/ocr-success.json)
- OCR error: [contracts/ocr-error.json](../contracts/ocr-error.json)
- confirmed OCR request: [contracts/confirmed-ocr-transaction-request.json](../contracts/confirmed-ocr-transaction-request.json)
- confirmed OCR response: [contracts/confirmed-ocr-transaction-response.json](../contracts/confirmed-ocr-transaction-response.json)
- service error: [contracts/service-error.json](../contracts/service-error.json)

## Default categories

If no `categoryOptions` prop is provided, the module uses:

- `Ăn uống`
- `Di chuyển`
- `Mua sắm`
- `Giải trí`
- `Hóa đơn`
- `Khác`

The OCR-suggested category is only used to prefill the category selector. The final saved category is whichever value the user confirms.

## Validation

```bash
npm run test:e2e
npm test
npm run build
```

The component keeps OCR output as temporary review input. Persistence starts only after the user confirms the fields and `finance-service` creates the final transaction record.

For full local setup with backend OCR plus the `auth-service` and `finance-service` microservices, see [docs/receipt-ocr-e2e.md](receipt-ocr-e2e.md).
