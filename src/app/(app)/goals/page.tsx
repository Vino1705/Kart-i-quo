
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Target } from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(2, 'Goal name is required'),
  targetAmount: z.coerce.number().min(1, 'Target amount must be positive'),
  timelineMonths: z.coerce.number().min(1, 'Timeline must be at least 1 month'),
});

type GoalValues = z.infer<typeof goalSchema>;

function AddGoalDialog() {
  const [open, setOpen] = useState(false);
  const { addGoal } = useApp();
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetAmount: 10000, timelineMonths: 6 },
  });

  function onSubmit(data: GoalValues) {
    addGoal(data);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Set a New Goal</DialogTitle>
          <DialogDescription>What are you saving for? Let's make a plan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Laptop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 80000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timelineMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeline (in months)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Save Goal</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalsPage() {
  const { goals } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Your Financial Goals</h1>
        <AddGoalDialog />
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const dailySavings = goal.targetAmount / (goal.timelineMonths * 30);
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {goal.name}
                  </CardTitle>
                  <CardDescription>
                    ₹{goal.currentAmount.toFixed(2)} saved of ₹{goal.targetAmount.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="w-full" />
                  <div className="mt-2 text-sm text-muted-foreground">{progress.toFixed(1)}% complete</div>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Save ~₹{dailySavings.toFixed(2)} daily to reach your goal in {goal.timelineMonths} months.
                  </p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-20 text-center">
            <Target className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Goals Yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Click 'Add New Goal' to start your savings journey.
            </p>
        </div>
      )}
    </div>
  );
}
