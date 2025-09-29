import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Montserrat, Nunito, Share_Tech_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: '800',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  variable: '--font-share-tech-mono',
  weight: '400',
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
        montserrat.variable,
        nunito.variable,
        shareTechMono.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
