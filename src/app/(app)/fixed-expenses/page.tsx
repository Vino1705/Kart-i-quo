
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Target, CheckCircle, RotateCcw } from 'lucide-react';
import { isAfter, addMonths, format, differenceInMonths } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function FixedExpensesPage() {
  const { profile, toggleFixedExpenseLoggedStatus, getLoggedFixedExpensesForMonth } = useApp();
  const fixedExpenses = profile?.fixedExpenses || [];
  
  const loggedExpenseIds = getLoggedFixedExpensesForMonth();

  const chartData = useMemo(() => {
    return fixedExpenses.map(exp => ({ name: exp.name, value: exp.amount }));
  }, [fixedExpenses]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return fixedExpenses.filter(exp => {
      if (exp.startDate && exp.timelineMonths) {
        const endDate = addMonths(new Date(exp.startDate), exp.timelineMonths);
        return isAfter(endDate, now) && differenceInMonths(endDate, now) <= 3;
      }
      return false;
    }).map(exp => {
        const endDate = addMonths(new Date(exp.startDate!), exp.timelineMonths!);
        return {...exp, endDate };
    });
  }, [fixedExpenses]);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline">Your Fixed Expenses</h1>
            <Button asChild>
                <Link href="/settings">Edit Expenses</Link>
            </Button>
        </div>

        {upcomingDeadlines.length > 0 && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Upcoming Deadlines!</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5">
                    {upcomingDeadlines.map(exp => (
                        <li key={exp.id}>
                            Your expense '<strong>{exp.name}</strong>' is scheduled to end on {format(exp.endDate, 'MMMM yyyy')}.
                        </li>
                    ))}
                    </ul>
                </AlertDescription>
            </Alert>
        )}
      
      <Card>
        <CardHeader>
          <CardTitle>Log Payments</CardTitle>
          <CardDescription>Check off your fixed expenses as you pay them for this month ({format(new Date(), 'MMMM yyyy')}). This is for your records only and won't affect your budget.</CardDescription>
        </CardHeader>
        <CardContent>
           {fixedExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedExpenses.map(exp => {
                    const isLogged = loggedExpenseIds.includes(exp.id);
                    return (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">{exp.name}</TableCell>
                        <TableCell><Badge variant="secondary">{exp.category}</Badge></TableCell>
                        <TableCell>₹{exp.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isLogged ? 'outline' : 'default'}
                            onClick={() => toggleFixedExpenseLoggedStatus(exp.id)}
                          >
                            {isLogged ? (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Mark as Unpaid
                              </>
                            ) : (
                               <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                               </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-[150px] text-center">
                  <p className="text-muted-foreground">No fixed expenses recorded.</p>
                  <p className="text-sm text-muted-foreground">Add them in your settings.</p>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Expenses Breakdown</CardTitle>
            <CardDescription>How your fixed costs are distributed.</CardDescription>
          </CardHeader>
          <CardContent>
            {fixedExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      if (percent < 0.05) return null;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-center">
                  <p className="text-muted-foreground">No fixed expenses recorded.</p>
                  <p className="text-sm text-muted-foreground">Add them in your settings.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>EMI & Loan Timelines</CardTitle>
                <CardDescription>Remaining duration for your time-bound expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {fixedExpenses.filter(e => e.timelineMonths).length > 0 ? fixedExpenses.filter(e => e.timelineMonths).map(exp => {
                    if (!exp.startDate || !exp.timelineMonths) return null;
                    
                    const startDate = new Date(exp.startDate);
                    const endDate = addMonths(startDate, exp.timelineMonths);
                    const totalMonths = exp.timelineMonths;
                    const elapsedMonths = differenceInMonths(new Date(), startDate);
                    const remainingMonths = totalMonths - elapsedMonths;
                    const progress = (elapsedMonths / totalMonths) * 100;

                    if (remainingMonths <= 0) return null;

                    return (
                        <div key={exp.id}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{exp.name}</span>
                                <span className="text-sm text-muted-foreground">
                                    {remainingMonths} / {totalMonths} months left
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-right mt-1 text-muted-foreground">Ends on {format(endDate, 'MMM yyyy')}</p>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center h-[350px] text-center">
                         <Target className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">No expenses with a fixed timeline.</p>
                        <p className="text-sm text-muted-foreground">You can add a timeline in settings.</p>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
