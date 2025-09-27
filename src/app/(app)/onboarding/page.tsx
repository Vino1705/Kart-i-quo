
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash, Wallet, PiggyBank, ShoppingCart } from 'lucide-react';
import React from 'react';
import { addMonths, formatISO } from 'date-fns';

const fixedExpenseSchema = z.object({
  name: z.string().min(1, 'Expense name is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  timelineMonths: z.coerce.number().optional(),
});

const onboardingSchema = z.object({
  role: z.enum(['Student', 'Professional', 'Housewife']),
  income: z.coerce.number().min(0, 'Income cannot be negative'),
  fixedExpenses: z.array(fixedExpenseSchema).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function SummaryCard({ title, amount, icon, description }: { title: string; amount: number; icon: React.ReactNode; description: string; }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-3">
                {icon}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
            </div>
            <div className="text-sm font-bold">₹{amount.toFixed(2)}</div>
        </div>
    )
}

export default function OnboardingPage() {
  const { updateProfile } = useApp();
  const router = useRouter();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      income: 50000,
      fixedExpenses: [{ name: 'Rent', amount: 15000 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fixedExpenses",
  });
  
  const watchedIncome = form.watch('income');
  const watchedFixedExpenses = form.watch('fixedExpenses');

  const { monthlyNeeds, monthlyWants, monthlySavings, dailyLimit } = React.useMemo(() => {
    const income = Number(watchedIncome) || 0;
    const fixed = watchedFixedExpenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

    const needs = fixed;
    const disposableIncome = income - needs;
    const wants = disposableIncome * 0.6; // 60% of disposable for wants
    const savings = disposableIncome * 0.4; // 40% of disposable for savings
    const daily = wants > 0 ? wants / 30 : 0;

    return { monthlyNeeds: needs, monthlyWants: wants, monthlySavings: savings, dailyLimit: daily };
  }, [watchedIncome, watchedFixedExpenses]);


  function onSubmit(data: OnboardingValues) {
    const income = data.income;
    const fixed = data.fixedExpenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
    
    const needs = fixed;
    const disposableIncome = income - needs;
    const wants = disposableIncome * 0.6;
    const savings = disposableIncome * 0.4;
    const dailyLimit = wants > 0 ? wants / 30 : 0;

    const profileData = {
      ...data,
      fixedExpenses: data.fixedExpenses?.map(exp => ({ 
        ...exp, 
        id: Math.random().toString(),
        startDate: exp.timelineMonths ? formatISO(new Date()) : undefined,
      })) || [],
      dailySpendingLimit: dailyLimit,
      monthlyNeeds: needs,
      monthlyWants: wants,
      monthlySavings: savings,
    };
    updateProfile(profileData);
    router.push('/dashboard');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome to Kwik Kash!</CardTitle>
          <CardDescription>Let's set up your financial profile to tailor your experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's your current role?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Housewife">Housewife</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Income (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label className="text-lg font-medium">Fixed Monthly Expenses</Label>
                <p className="text-sm text-muted-foreground mb-4">Enter expenses like rent, EMIs, or subscriptions. This is your 'Needs' category.</p>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name={`fixedExpenses.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">Expense Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Expense Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fixedExpenses.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel className="sr-only">Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Amount (₹)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                          control={form.control}
                          name={`fixedExpenses.${index}.timelineMonths`}
                          render={({ field }) => (
                            <FormItem className="w-1/4">
                              <FormLabel className="sr-only">Timeline</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Months (Opt)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ name: '', amount: 0 })}
                  >
                    Add Expense
                  </Button>
              </div>
              
              <Card className="bg-secondary/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Financial Breakdown</CardTitle>
                    <CardDescription>After fixed costs, your disposable income is split between Wants (60%) and Savings (40%).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <SummaryCard title="Needs" amount={monthlyNeeds} icon={<Wallet className="h-5 w-5 text-primary" />} description={`Your calculated fixed costs.`} />
                    <SummaryCard title="Wants" amount={monthlyWants} icon={<ShoppingCart className="h-5 w-5 text-accent" />} description="For discretionary spending." />
                    <SummaryCard title="Savings" amount={monthlySavings} icon={<PiggyBank className="h-5 w-5 text-green-500" />} description="For goals & emergencies." />
                  </CardContent>
                   <CardFooter>
                     <div className="w-full flex justify-between items-center p-3 rounded-lg bg-primary/10">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Suggested Daily Spending</span>
                            <span className="text-xs text-muted-foreground">This is your 'Wants' budget per day.</span>
                        </div>
                        <div className="text-xl font-bold font-headline text-primary">₹{dailyLimit.toFixed(2)}</div>
                     </div>
                  </CardFooter>
              </Card>

              <Button type="submit" className="w-full" size="lg">Complete Setup</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
