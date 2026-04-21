import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { InlineMessage } from "../components/InlineMessage";
import { PageShell } from "../components/PageShell";
import type { ApiError } from "../../receipt-ocr/types";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Unable to complete the request.";
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/ocr" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.full_name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Confirm password must match password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password
      });
      navigate("/ocr", { replace: true });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Register"
      description="Create an account in auth-service so the protected OCR transaction flow can load your finance data."
    >
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Full name">
            <input
              className={INPUT_CLASS}
              type="text"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Nguyen Van A"
            />
          </Field>

          <Field label="Email">
            <input
              className={INPUT_CLASS}
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              className={INPUT_CLASS}
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Create a password"
            />
          </Field>

          <Field label="Confirm password">
            <input
              className={INPUT_CLASS}
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              placeholder="Repeat your password"
            />
          </Field>

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-sky-700 px-4 py-3 text-sm font-medium text-white disabled:bg-sky-300"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-sky-700 hover:text-sky-800" to="/login">
            Login
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
