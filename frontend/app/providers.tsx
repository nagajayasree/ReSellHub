'use client';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
