import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { InlineMessage } from "../../components/shared/InlineMessage";
import { useAuth } from "../../features/auth/AuthContext";
import type { ApiError } from "../../types/ocr";

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
    <div className="auth-shell auth-shell--register">
      <section className="auth-shell__hero">
        <div className="section-header__eyebrow">Personal finance onboarding</div>
        <h1>Create your finance command center.</h1>
        <p>Move from account setup to dashboard, OCR receipts, budgets, and AI-guided analysis in one sequence.</p>
        <ol className="auth-timeline">
          <li>Authenticate through auth-service</li>
          <li>Land in the protected finance shell</li>
          <li>Start tracking, scanning, and optimizing</li>
        </ol>
      </section>

      <section className="auth-shell__card">
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Vanilla Ledger</strong>
            <span>Create your workspace</span>
          </div>
        </div>
        <div className="auth-shell__copy">
          <div className="section-header__eyebrow">New workspace</div>
          <h2>Register</h2>
          <p>Set up the account that unlocks protected dashboard, OCR, and AI Vanilla routes.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input className="field-control" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="field-control" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="field-control" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input className="field-control" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </label>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          <button className="button button--accent button--block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-form__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
