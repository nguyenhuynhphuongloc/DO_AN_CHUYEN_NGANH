'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Shell } from '@/components/shell';
import { login } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      saveAuthSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        email: response.user.email,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <section className="mx-auto max-w-xl rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.35em] text-accent">Login</p>
        <h2 className="mt-3 text-3xl font-semibold">Access the finance workspace</h2>
        <p className="mt-3 text-neutral-600">Use the seeded development user or register directly via the auth API.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email</span>
            <input
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </Shell>
  );
}
