
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
import { AppProvider, useApp } from '@/context/app-context';
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
  const { onboardingComplete, logout, profile } = useApp();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        router.replace('/login');
      } else {
        const isOnboardingPage = pathname === '/onboarding';
        if (!onboardingComplete && !isOnboardingPage) {
          router.replace('/onboarding');
        } else if (onboardingComplete && isOnboardingPage) {
          router.replace('/dashboard');
        }
      }
    });

    return () => unsubscribe();
  }, [onboardingComplete, pathname, router, auth]);

  if (!profile) return (
     <div className="flex h-screen items-center justify-center">
        <p>Loading your profile...</p>
     </div>
  );

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
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
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
