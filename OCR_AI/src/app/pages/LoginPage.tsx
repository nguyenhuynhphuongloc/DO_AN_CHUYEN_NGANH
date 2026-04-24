import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { InlineMessage } from "../../components/shared/InlineMessage";
import { useAuth } from "../../features/auth/AuthContext";
import type { ApiError } from "../../types/ocr";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Unable to complete the request.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(
    () => (typeof location.state?.from === "string" ? location.state.from : "/ocr"),
    [location.state]
  );

  if (isAuthenticated) {
    return <Navigate to="/ocr" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      if (!rememberMe) {
        sessionStorage.setItem("vanilla-ledger.ephemeral-login", "true");
      }
      navigate(redirectTo, { replace: true });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-shell__hero">
        <div className="section-header__eyebrow">Personal finance workspace</div>
        <h1>Operate money, receipts, and AI guidance from one clear workspace.</h1>
        <p>
          Keep dashboards, OCR receipt capture, and AI assistance in one light, easier-to-read flow.
        </p>
        <div className="auth-hero__metrics">
          <article><strong>Dashboard-ready</strong><span>KPI-rich shell after login</span></article>
          <article><strong>OCR-first ingestion</strong><span>Preview, edit, confirm, and save</span></article>
          <article><strong>AI workspace</strong><span>Chatbot and OCR under one module</span></article>
        </div>
      </section>

      <section className="auth-shell__card">
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Vanilla Ledger</strong>
            <span>Finance management</span>
          </div>
        </div>
        <div className="auth-shell__copy">
          <div className="section-header__eyebrow">Welcome back</div>
          <h2>Login</h2>
          <p>Enter the command layer for budgets, transactions, reports, receipts, and AI Vanilla.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input className="field-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="field-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </label>
          <div className="auth-form__row">
            <label className="checkbox">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember me</span>
            </label>
            <button className="text-button" type="button">Forgot password</button>
          </div>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          <button className="button button--accent button--block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          <div className="auth-social">
            <span>Social login placeholder</span>
          </div>
        </form>

        <p className="auth-form__footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}
