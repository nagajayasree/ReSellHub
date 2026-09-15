'use client';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}
