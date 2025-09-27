
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  CheckCircle,
  Target,
  PieChart,
  History,
  LogOut,
  Settings,
} from 'lucide-react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import firebaseApp from '@/lib/firebase';
import { AppProvider } from '@/context/app-context';
import { useApp } from '@/hooks/use-app';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import Chatbot from '@/components/chatbot';
import { Logo } from '@/components/logo';

const navItems = [
  { href: '/dashboard', icon: <LayoutGrid />, label: 'Dashboard' },
  { href: '/check-in', icon: <CheckCircle />, label: 'Daily Check-in' },
  { href: '/goals', icon: <Target />, label: 'Goals' },
  { href: '/expenses', icon: <PieChart />, label: 'Expenses' },
  { href: '/transactions', icon: <History />, label: 'Transactions' },
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, profile } = useApp();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      const isOnboardingPage = pathname === '/onboarding';
      if (!user) {
        if (!isOnboardingPage) {
            router.replace('/login');
        }
      } else {
        if (profile) {
            if (!profile.role && !isOnboardingPage) {
              router.replace('/onboarding');
            } else if (profile.role && isOnboardingPage) {
              router.replace('/dashboard');
            }
        }
      }
    });

    return () => unsubscribe();
  }, [profile, pathname, router, auth]);

  if (!profile && pathname !== '/onboarding') return (
     <div className="flex h-screen items-center justify-center">
        <p>Loading your profile...</p>
     </div>
  );

  if (pathname === '/onboarding') {
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
                <Logo />
                <span className="font-bold text-lg">Kwik Kash</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/settings">
                        <SidebarMenuButton tooltip="Settings" isActive={pathname === '/settings'}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Log Out" onClick={logout}>
                        <LogOut />
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <SidebarInset>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
        <Chatbot />
      </div>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </AppProvider>
    )
}
