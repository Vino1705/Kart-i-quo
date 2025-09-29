
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/hooks/use-app';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard Overview',
  '/check-in': 'Daily Expense Check-in',
  '/goals': 'Financial Goals',
  '/expenses': 'Expense Analysis',
  '/fixed-expenses': 'Fixed Expenses Analysis',
  '/emergency-fund': 'Emergency Fund',
  '/onboarding': 'Welcome to Kart-i-quo',
  '/settings': 'Profile Settings',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { profile } = useApp();
  const title = pageTitles[pathname] || 'Kart-i-quo';

  const getInitials = (role: string | undefined) => {
    if (!role) return 'U';
    return role.charAt(0).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">{title}</h1>
      <Avatar>
        <AvatarImage src={`https://avatar.vercel.sh/${profile?.role || 'user'}.png`} />
        <AvatarFallback>{getInitials(profile?.role)}</AvatarFallback>
      </Avatar>
    </header>
  );
}
