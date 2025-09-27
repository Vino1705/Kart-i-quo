import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bot, Goal, BarChart } from 'lucide-react';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';

const heroImage = placeholderImages.find(p => p.id === "hero-image");

const features = [
  {
    icon: <Goal className="h-10 w-10 text-primary" />,
    title: 'Goal-First Budgeting',
    description: 'Set financial goals and let our AI auto-allocate your income to help you achieve them faster.',
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-primary" />,
    title: 'Daily Expense Tracking',
    description: 'Log your daily spending against a customizable limit and get instant profit/loss feedback.',
  },
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Chatbot',
    description: 'Get financial advice, simulate scenarios, and receive role-specific tips from our Gemini-powered chatbot.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Smart Forecasting',
    description: 'Our AI analyzes your spending patterns to predict future expenses and sends proactive alerts.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
            <span className="font-bold">Kwik Kash</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col items-start gap-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl font-headline">
                Master Your Money, <br className="hidden sm:inline" />
                Effortlessly.
              </h1>
              <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
                Kwik Kash is your AI-powered financial coach. We help you set goals, track spending, and build wealth with proactive, personalized advice. No more passive tracking, only active planning.
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Start for Free</Link>
                </Button>
              </div>
            </div>
            {heroImage && (
              <div className="flex justify-center">
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={500}
                  height={500}
                  className="rounded-lg shadow-2xl"
                  data-ai-hint={heroImage.imageHint}
                />
              </div>
            )}
          </div>
        </section>

        <section id="features" className="bg-secondary py-12 md:py-24">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
                Your Personal Financial Coach
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Kwik Kash provides the tools you need to take control of your finances.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-24">
           <div className="mx-auto max-w-4xl rounded-lg bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="text-3xl font-bold md:text-4xl font-headline">Ready to transform your financial future?</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join Kwik Kash today and start your journey towards financial freedom.
            </p>
            <Button variant="secondary" size="lg" className="mt-8" asChild>
              <Link href="/signup">Sign Up Now</Link>
            </Button>
          </div>
        </section>

      </main>

      <footer className="border-t bg-secondary">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose md:text-left">
              © {new Date().getFullYear()} Kwik Kash. All rights reserved.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Built for a better financial you.
          </p>
        </div>
      </footer>
    </div>
  );
}
