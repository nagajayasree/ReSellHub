'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/" className="text-lg font-semibold text-gray-900">
        ReSellHub
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/listings/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Item
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 text-sm font-medium text-gray-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              Hi,{user.name} !
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
