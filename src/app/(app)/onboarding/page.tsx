
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash } from 'lucide-react';

const fixedExpenseSchema = z.object({
  name: z.string().min(1, 'Expense name is required'),
  amount: z.coerce.number().min(1, 'Amount must be positive'),
});

const onboardingSchema = z.object({
  role: z.enum(['Student', 'Professional', 'Housewife']),
  income: z.coerce.number().min(0, 'Income cannot be negative'),
  dailySpendingLimit: z.coerce.number().min(0, 'Daily limit must be positive'),
  fixedExpenses: z.array(fixedExpenseSchema).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { updateProfile } = useApp();
  const router = useRouter();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      income: 10000,
      dailySpendingLimit: 300,
      fixedExpenses: [{ name: 'Rent', amount: 3000 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fixedExpenses",
  });

  function onSubmit(data: OnboardingValues) {
    const profileData = {
      ...data,
      fixedExpenses: data.fixedExpenses?.map(exp => ({ ...exp, id: Math.random().toString() })) || [],
    };
    updateProfile(profileData);
    router.push('/dashboard');
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome to Kwik Kash!</CardTitle>
          <CardDescription>Let's set up your financial profile. This will help us tailor your experience.</CardDescription>
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
                <p className="text-sm text-muted-foreground mb-4">Enter expenses like rent, EMIs, or subscriptions.</p>
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

              <FormField
                  control={form.control}
                  name="dailySpendingLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Spending Limit (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 300" {...field} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">This is your target for daily discretionary spending.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit" className="w-full" size="lg">Complete Setup</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
