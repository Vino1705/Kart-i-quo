
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import AppLayout from './layout';

export default function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useApp();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (user === null) {
      if (!['/login', '/signup', '/', '/onboarding'].includes(pathname)) {
        router.replace('/login');
      }
    }
    setAuthChecked(true);
  }, [user, pathname, router]);

  useEffect(() => {
    if (authChecked && user) {
        const isOnboardingPage = pathname === '/onboarding';
        const hasCompletedOnboarding = profile && profile.role;

        if (user && hasCompletedOnboarding && isOnboardingPage) {
            router.replace('/dashboard');
        } else if (user && !hasCompletedOnboarding && !isOnboardingPage && pathname !== '/') {
             router.replace('/onboarding');
        }
    }
  }, [profile, user, pathname, router, authChecked]);

  if (!authChecked || (user && profile === undefined && pathname !== '/onboarding')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading your experience...</p>
      </div>
    );
  }

  const isPublicPage = ['/login', '/signup', '/'].includes(pathname);
  if (isPublicPage) {
      return <>{children}</>;
  }

  if (pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  // If we are here, user is logged in and onboarding is complete (or not needed)
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
