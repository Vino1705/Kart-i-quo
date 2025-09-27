
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
      role: profile?.role,
      income: profile?.income,
      fixedExpenses: profile?.fixedExpenses,
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
    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;
    const dailyLimit = wants / 30;

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
    updateProfile(profileData);
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
            
            <Button type="submit" className="w-full" size="lg">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
