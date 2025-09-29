import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Nunito } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/context/app-context';
import AppLayoutContent from './(app)/app-layout';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});


export const metadata: Metadata = {
  title: 'Kart-i-quo',
  description: 'AI-powered smart budget tracker to master your finances.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        "font-body antialiased",
        nunito.variable
      )}>
        <AppProvider>
            <AppLayoutContent>
                {children}
            </AppLayoutContent>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
