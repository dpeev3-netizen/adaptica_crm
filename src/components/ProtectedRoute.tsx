"use client";

import { useAuth } from '@/store/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token && pathname !== '/login') {
      router.push('/login');
    }
  }, [mounted, token, pathname, router]);

  if (!mounted) return null;

  if (!token && pathname !== '/login') {
    return null; // hide private content while redirecting
  }

  return <>{children}</>;
}
