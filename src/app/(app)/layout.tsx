
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  CheckCircle,
  Target,
  PieChart,
  LogOut,
  Settings,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import Chatbot from '@/components/chatbot';
import { Logo } from '@/components/logo';

const navItems = [
  { href: '/dashboard', icon: <LayoutGrid />, label: 'Dashboard' },
  { href: '/check-in', icon: <CheckCircle />, label: 'Daily Check-in' },
  { href: '/goals', icon: <Target />, label: 'Goals' },
  { href: '/expenses', icon: <PieChart />, label: 'Expenses' },
  { href: '/fixed-expenses', icon: <CreditCard />, label: 'Fixed Expenses' },
  { href: '/emergency-fund', icon: <ShieldAlert />, label: 'Emergency Fund' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, profile } = useApp();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (user === null) {
        router.replace('/login');
    }
    setAuthChecked(true);
  }, [user, router]);
  
  useEffect(() => {
    if (authChecked && user) {
        const hasCompletedOnboarding = profile && profile.role;
        const isOnboardingPage = pathname === '/onboarding';

        if (hasCompletedOnboarding && isOnboardingPage) {
            router.replace('/dashboard');
        } else if (!hasCompletedOnboarding && !isOnboardingPage) {
            router.replace('/onboarding');
        }
    }
  }, [authChecked, user, profile, pathname, router]);

  if (!authChecked || !user || !profile?.role) {
    // Show a loading state or the onboarding page itself
    if (pathname === '/onboarding') {
        return <>{children}</>;
    }
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading your experience...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
                <Logo />
                <span className="font-bold text-lg">Kart-i-quo</span>
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
