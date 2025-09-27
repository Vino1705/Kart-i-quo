import { PiggyBank, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return <Wallet className={cn("h-6 w-6 text-primary", className)} />;
}

export function SavingsIcon({ className }: { className?: string }) {
    return <PiggyBank className={cn("h-6 w-6 text-primary", className)} />;
}
