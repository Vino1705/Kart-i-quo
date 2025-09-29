
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
    // This effect runs once to check the initial auth state.
    if (user === null && !['/login', '/signup', '/', '/onboarding'].includes(pathname)) {
        router.replace('/login');
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


  // Show a loading state until authentication has been checked.
  if (!authChecked || (user && profile === undefined && pathname !== '/onboarding' && pathname !== '/')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading your experience...</p>
      </div>
    );
  }

  // If the user is not logged in, or is on a public page, show the children directly.
  // This covers the landing page ('/'), login, signup.
  const isPublicPage = ['/login', '/signup', '/'].includes(pathname);
  if (!user || isPublicPage) {
      return <>{children}</>;
  }

  // If the user is logged in but hasn't completed onboarding, show the onboarding page.
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  // If we are here, user is logged in and onboarding is complete.
  // Wrap the children with the main application layout.
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
