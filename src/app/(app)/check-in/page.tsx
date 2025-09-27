
"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { expenseCategories, Transaction } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EndOfDaySummary } from '@/components/end-of-day-summary';

const expenseSchema = z.object({
  id: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(1, 'Description is required'),
});

type ExpenseValues = z.infer<typeof expenseSchema>;

export default function CheckInPage() {
  const { profile, addTransaction, getTodaysSpending, transactions, updateTransaction, deleteTransaction } = useApp();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: '',
      description: '',
    },
  });

  const editForm = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema)
  });

  const todaysSpending = getTodaysSpending();
  const dailyLimit = profile?.dailySpendingLimit || 0;
  const progress = dailyLimit > 0 ? (todaysSpending / dailyLimit) * 100 : 0;
  const remaining = dailyLimit - todaysSpending;

  const today = new Date().toISOString().split('T')[0];
  const todaysTransactions = transactions
    .filter(t => t.date.startsWith(today))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function onSubmit(data: ExpenseValues) {
    addTransaction(data);
    form.reset({ amount: 0, category: '', description: ''});
  }

  function onEditSubmit(data: ExpenseValues) {
    if (!editingTransaction) return;
    updateTransaction(editingTransaction.id, data);
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  }

  function handleEditClick(transaction: Transaction) {
    setEditingTransaction(transaction);
    editForm.reset(transaction);
    setIsEditDialogOpen(true);
  }

  function handleDelete(transactionId: string) {
    deleteTransaction(transactionId);
  }

  return (
    <>
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Log Today's Expense</CardTitle>
          <CardDescription>Keep track of your daily spending.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lunch with friends" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Add Expense</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Today's Spending Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between font-medium">
                <span>Spent Today</span>
                <span>₹{todaysSpending.toFixed(2)} / ₹{dailyLimit.toFixed(2)}</span>
              </div>
              <Progress value={progress} />
              <div className={`text-center font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {remaining >= 0 ? `₹${remaining.toFixed(2)} Remaining` : `₹${Math.abs(remaining).toFixed(2)} Over Limit`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Today's Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysTransactions.map((t) => (
                    <TableRow key={t.id}>
                       <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-right">₹{t.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(t)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this transaction.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(t.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No expenses logged for today yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                    <DialogDescription>Update the details of your expense.</DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                        <FormField
                            control={editForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {expenseCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
    <EndOfDaySummary />
    </>
  );
}
