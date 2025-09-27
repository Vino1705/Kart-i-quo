
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Target, Pencil, Wallet } from 'lucide-react';
import { Goal } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';


const goalSchema = z.object({
  name: z.string().min(2, 'Goal name is required'),
  targetAmount: z.coerce.number().min(1, 'Target amount must be positive'),
  monthlyContribution: z.coerce.number().min(1, 'Contribution must be positive'),
  timelineMonths: z.coerce.number().optional(),
});

type GoalValues = z.infer<typeof goalSchema>;

function GoalDialog({ goal, children }: { goal?: Goal, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addGoal, updateGoal, profile, getTotalGoalContributions } = useApp();
  
  const isEditMode = !!goal;

  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: isEditMode 
      ? { name: goal.name, targetAmount: goal.targetAmount, monthlyContribution: goal.monthlyContribution }
      : { name: '', targetAmount: 10000, monthlyContribution: 1000 },
  });

  const { targetAmount, monthlyContribution } = form.watch();

  const { timelineMonths, suggestion } = useMemo(() => {
    if (targetAmount > 0 && monthlyContribution > 0) {
      const months = Math.ceil(targetAmount / monthlyContribution);
      return {
        timelineMonths: months,
        suggestion: `At ₹${monthlyContribution.toLocaleString()}/month, you'll reach your goal in ~${months} months.`,
      };
    }
    return { timelineMonths: 0, suggestion: 'Enter an amount and contribution to see a forecast.' };
  }, [targetAmount, monthlyContribution]);

  const totalSavings = profile?.monthlySavings || 0;
  const committedContributions = getTotalGoalContributions() - (goal?.monthlyContribution || 0);
  const availableSavings = totalSavings - committedContributions;

  function onSubmit(data: GoalValues) {
    if (data.monthlyContribution > availableSavings) {
        form.setError("monthlyContribution", {
            type: "manual",
            message: `Contribution exceeds available savings of ₹${availableSavings.toFixed(2)}.`
        });
        return;
    }

    if (isEditMode) {
      updateGoal(goal.id, {...data, timelineMonths });
    } else {
      addGoal({...data, timelineMonths });
    }
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? 'Edit Goal' : 'Set a New Goal'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update your savings goal details.' : "What are you saving for? Let's make a plan."}
          </DialogDescription>
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
              name="monthlyContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Contribution (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <Alert variant="default" className="text-sm">
                <Target className="h-4 w-4" />
                <AlertDescription>
                    <p>{suggestion}</p>
                    { availableSavings >= 0 ?
                        <p className="font-medium mt-2">Available for Goals: ₹{availableSavings.toFixed(2)} / month</p>
                        :
                        <p className="font-medium mt-2 text-destructive">You've committed all your savings.</p>
                    }
                </AlertDescription>
            </Alert>
            <Button type="submit" className="w-full">{isEditMode ? 'Save Changes' : 'Save Goal'}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ContributeDialog({ goal, children }: { goal: Goal, children: React.ReactNode }) {
    const { contributeToGoal, profile } = useApp();
    const [amount, setAmount] = useState(goal.monthlyContribution);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const monthlySavings = profile?.monthlySavings || 0;
    const goalContributions = (profile?.goals || []).reduce((sum, g) => sum + g.monthlyContribution, 0);
    const emergencyFund = monthlySavings - goalContributions;


    const handleContribute = () => {
        if (amount <= 0) {
             toast({ variant: 'destructive', title: "Invalid Amount", description: "Contribution must be positive." });
            return;
        }
        
        contributeToGoal(goal.id, amount);
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribute to '{goal.name}'</DialogTitle>
                    <DialogDescription>
                        How much would you like to contribute to this goal? Your available emergency fund after this is shown for reference.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Contribution Amount (₹)</Label>
                        <Input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))}
                        />
                    </div>
                     <Alert variant="default">
                        <Wallet className="h-4 w-4" />
                        <AlertDescription>
                            Your remaining emergency fund savings after this contribution would be approximately ₹{(emergencyFund - amount).toFixed(2)}.
                        </AlertDescription>
                    </Alert>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleContribute}>Contribute ₹{amount}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GoalsPage() {
  const { goals } = useApp();
  
  const chartData = useMemo(() => {
    return goals.map(goal => ({
      name: goal.name,
      Saved: goal.currentAmount,
      Target: goal.targetAmount,
    }));
  }, [goals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-headline">Your Financial Goals</h1>
        <div className="flex gap-2">
            <GoalDialog>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Goal
                </Button>
            </GoalDialog>
        </div>
      </div>
      
      {goals.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Goals Progress</CardTitle>
                  <CardDescription>A visual summary of your progress towards each goal.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                          <Tooltip
                              contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  borderColor: 'hsl(var(--border))',
                              }}
                              formatter={(value: number) => `₹${value.toFixed(2)}`}
                          />
                          <Legend />
                          <Bar dataKey="Saved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Target" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      )}


      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const remainingMonths = remainingAmount > 0 && goal.monthlyContribution > 0
                ? Math.ceil(remainingAmount / goal.monthlyContribution)
                : 0;
            
            return (
              <Card key={goal.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {goal.name}
                        </CardTitle>
                         <GoalDialog goal={goal}>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-4 w-4" />
                             </Button>
                         </GoalDialog>
                    </div>
                  <CardDescription>
                    ₹{goal.currentAmount.toFixed(2)} saved of ₹{goal.targetAmount.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <Progress value={progress} className="w-full" />
                  <div className="text-sm text-muted-foreground">{progress.toFixed(1)}% complete</div>
                  <p className="text-xs text-muted-foreground">
                    {remainingMonths > 0
                      ? `~${remainingMonths} months remaining at ₹${goal.monthlyContribution.toFixed(2)}/month.`
                      : "Congratulations! You've reached this goal."
                    }
                  </p>
                </CardContent>
                <CardFooter>
                    <ContributeDialog goal={goal}>
                        <Button className="w-full">
                            <Wallet className="mr-2 h-4 w-4" /> Contribute
                        </Button>
                    </ContributeDialog>
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
