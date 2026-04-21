import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestApp } from "../src/app/TestApp";
import type { AppConfig } from "../src/app/config";

const TEST_CONFIG: AppConfig = {
  authServiceUrl: "http://auth-service.test",
  financeServiceUrl: "http://finance-service.test",
  ocrEndpoint: "http://ocr-service.test/webhook/receipt-ocr"
};

describe("frontend auth flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated users from /ocr to /login", async () => {
    render(<TestApp config={TEST_CONFIG} initialEntries={["/ocr"]} />);

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it("registers a user and redirects to the protected OCR page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/auth/register")) {
        return new Response(
          JSON.stringify({
            user: {
              id: "user-1",
              full_name: "Nguyen Van A",
              email: "nguyen@example.com",
              avatar_url: null,
              status: "active",
              email_verified: false,
              last_login_at: null,
              roles: ["user"]
            },
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "Bearer",
            access_expires_at: "2026-04-21T10:00:00.000Z",
            refresh_expires_at: "2026-05-21T10:00:00.000Z"
          }),
          { status: 201, headers: { "content-type": "application/json" } }
        );
      }

      if (url.endsWith("/wallets")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "wallet-1",
                name: "Cash Wallet",
                currency: "VND",
                balance: 1000000,
                is_default: true
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TestApp config={TEST_CONFIG} initialEntries={["/register"]} />);

    await user.type(screen.getByLabelText(/full name/i), "Nguyen Van A");
    await user.type(screen.getByLabelText(/^email$/i), "nguyen@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Authenticated OCR" })).toBeInTheDocument();
    });
  });

  it("logs in and redirects to /ocr", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/auth/login")) {
        return new Response(
          JSON.stringify({
            user: {
              id: "user-1",
              full_name: "Nguyen Van A",
              email: "nguyen@example.com",
              avatar_url: null,
              status: "active",
              email_verified: false,
              last_login_at: null,
              roles: ["user"]
            },
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "Bearer",
            access_expires_at: "2026-04-21T10:00:00.000Z",
            refresh_expires_at: "2026-05-21T10:00:00.000Z"
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (url.endsWith("/wallets")) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TestApp config={TEST_CONFIG} initialEntries={["/login"]} />);

    await user.type(screen.getByLabelText(/^email$/i), "nguyen@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Authenticated OCR" })).toBeInTheDocument();
    });
  });
});
