import { createContext, PropsWithChildren, useContext } from "react";

export interface AppConfig {
  authServiceUrl: string;
  financeServiceUrl: string;
  ocrFormEndpoint: string;
  ocrChatbotEndpoint: string;
}

export const defaultAppConfig: AppConfig = {
  authServiceUrl: import.meta.env.VITE_AUTH_SERVICE_URL ?? "http://127.0.0.1:5002",
  financeServiceUrl: import.meta.env.VITE_FINANCE_SERVICE_URL ?? "http://127.0.0.1:5003",
  ocrFormEndpoint:
    import.meta.env.VITE_OCR_FORM_ENDPOINT ?? "http://127.0.0.1:5001/webhook/receipt-ocr-form",
  ocrChatbotEndpoint:
    import.meta.env.VITE_OCR_CHATBOT_ENDPOINT ?? "http://127.0.0.1:5001/webhook/receipt-ocr-chatbot"
};

const AppConfigContext = createContext<AppConfig>(defaultAppConfig);

export function AppConfigProvider({
  children,
  value = defaultAppConfig
}: PropsWithChildren<{ value?: AppConfig }>) {
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
