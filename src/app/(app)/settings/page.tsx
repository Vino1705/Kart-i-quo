
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash } from 'lucide-react';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { formatISO } from 'date-fns';
import { Label } from '@/components/ui/label';


const fixedExpenseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Expense name is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  timelineMonths: z.coerce.number().optional(),
  startDate: z.string().optional(),
});

const profileSchema = z.object({
  role: z.enum(['Student', 'Professional', 'Housewife']),
  income: z.coerce.number().min(0, 'Income cannot be negative'),
  fixedExpenses: z.array(fixedExpenseSchema).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;


export default function SettingsPage() {
  const { profile, updateProfile } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: profile?.role || 'Professional',
      income: profile?.income || 0,
      fixedExpenses: profile?.fixedExpenses || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fixedExpenses",
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        role: profile.role,
        income: profile.income,
        fixedExpenses: profile.fixedExpenses,
      });
    }
  }, [profile, form]);

  function onSubmit(data: ProfileValues) {
    const income = data.income;
    const fixed = data.fixedExpenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

    const needs = fixed;
    const disposableIncome = income - needs;
    const wants = disposableIncome >= 0 ? disposableIncome * 0.6 : 0;
    const savings = disposableIncome >= 0 ? disposableIncome * 0.4 : 0;
    const dailyLimit = wants > 0 ? wants / 30 : 0;

    const profileData = {
      ...profile,
      ...data,
      fixedExpenses: data.fixedExpenses?.map(exp => ({ 
          ...exp, 
          id: exp.id || Math.random().toString(),
          startDate: exp.timelineMonths && !exp.startDate ? formatISO(new Date()) : exp.startDate
      })) || [],
      dailySpendingLimit: dailyLimit,
      monthlyNeeds: needs,
      monthlyWants: wants,
      monthlySavings: savings,
    };
    
    updateProfile(profileData as any);
    toast({
        title: "Profile Updated",
        description: "Your financial details have been successfully updated.",
    })
    router.push('/dashboard');
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Profile Settings</CardTitle>
        <CardDescription>Update your personal and financial information here.</CardDescription>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <p className="text-sm text-muted-foreground mb-4">Update your recurring expenses like rent, EMIs, or subscriptions.</p>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
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
                        <FormItem className="w-1/4">
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
                  onClick={() => append({ name: '', amount: 0, timelineMonths: undefined })}
                >
                  Add Expense
                </Button>
            </div>

            <Button type="submit" className="w-full" size="lg">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
