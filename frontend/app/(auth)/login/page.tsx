'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submitLogin() {
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;
      setError(message || 'Invalid email or password');
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm px-6">
      <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Log in</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLogin();
          }}
          className="flex flex-col gap-4"
        >
          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-gray-900 hover:only"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
