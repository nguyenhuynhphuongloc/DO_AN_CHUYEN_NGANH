/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL?: string;
  readonly VITE_FINANCE_SERVICE_URL?: string;
  readonly VITE_OCR_FORM_ENDPOINT?: string;
  readonly VITE_OCR_CHATBOT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
