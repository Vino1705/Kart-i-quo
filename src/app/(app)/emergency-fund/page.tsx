
"use client";

import { useState } from 'react';
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
import { ShieldAlert, Plus, Minus, PiggyBank, Pencil, History, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const fundActionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be positive'),
  notes: z.string().optional(),
});

type FundActionValues = z.infer<typeof fundActionSchema>;

function FundActionDialog({ type, children }: { type: 'deposit' | 'withdraw', children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { updateEmergencyFund } = useApp();
  
  const form = useForm<FundActionValues>({
    resolver: zodResolver(fundActionSchema),
    defaultValues: { amount: 1000, notes: '' },
  });

  function onSubmit(data: FundActionValues) {
    updateEmergencyFund(type, data.amount, data.notes);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{type} Funds</DialogTitle>
          <DialogDescription>
            {type === 'deposit' ? 'Add money to your emergency fund.' : 'Withdraw money from your emergency fund.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder={type === 'withdraw' ? "e.g., Unplanned car repair" : "e.g., Monthly contribution"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full capitalize">{type}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SetTargetDialog() {
  const { profile, setEmergencyFundTarget } = useApp();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(profile?.emergencyFund.target || 0);

  const handleSave = () => {
    setEmergencyFundTarget(target);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Emergency Fund Target</DialogTitle>
          <DialogDescription>Your target should ideally cover 3-6 months of essential living expenses.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label>Target Amount (₹)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Target</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function EmergencyFundPage() {
  const { profile } = useApp();

  const emergencyFund = profile?.emergencyFund;
  const progress = emergencyFund && emergencyFund.target > 0 ? (emergencyFund.current / emergencyFund.target) * 100 : 0;
  const sortedHistory = emergencyFund?.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (!emergencyFund) {
    return (
      <div className="text-center">
        <p>Loading emergency fund data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary"/>
            Emergency Fund
        </h1>
        <div className="flex gap-2">
          <FundActionDialog type="withdraw">
            <Button variant="outline">
                <Minus className="mr-2 h-4 w-4" />
                Withdraw
            </Button>
          </FundActionDialog>
          <FundActionDialog type="deposit">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Deposit
            </Button>
          </FundActionDialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                    Fund Progress
                </CardTitle>
                <div className="text-right">
                    <p className="text-2xl font-bold">₹{emergencyFund.current.toFixed(2)}</p>
                    <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <span>Target: ₹{emergencyFund.target.toFixed(2)}</span>
                        <SetTargetDialog />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
             <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
            </CardTitle>
            <CardDescription>A log of all deposits and withdrawals from your fund.</CardDescription>
        </CardHeader>
        <CardContent>
             <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                {sortedHistory && sortedHistory.length > 0 ? (
                    sortedHistory.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center rounded-md border p-4">
                        <div className="flex items-center gap-4">
                             {entry.type === 'deposit' ? <TrendingUp className="h-6 w-6 text-green-500" /> : <TrendingDown className="h-6 w-6 text-destructive" />}
                            <div>
                                <p className={`font-semibold ${entry.type === 'deposit' ? 'text-green-500' : 'text-destructive'}`}>
                                    {entry.type === 'deposit' ? '+' : '-'} ₹{entry.amount.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(entry.date), 'PPP p')}
                                </p>
                                 {entry.notes && <p className="text-sm mt-1">"{entry.notes}"</p>}
                            </div>
                        </div>
                        <div className={`text-sm font-semibold capitalize px-3 py-1 rounded-full ${entry.type === 'deposit' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                            {entry.type}
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-20 text-center">
                        <PiggyBank className="h-12 w-12 text-muted-foreground" />
                        <h2 className="mt-4 text-xl font-semibold">No History Yet</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                        Make your first deposit to start building your safety net.
                        </p>
                    </div>
                )}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}
