
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { IndianRupee, Target, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/hooks/use-app';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

function StatCard({ title, value, icon, change, changeType }: { title: string, value: string, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center">
            {changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> : <TrendingDown className="h-4 w-4 mr-1 text-red-500" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { profile, goals, transactions, getTodaysSpending } = useApp();

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  
  const todaysSpending = getTodaysSpending();
  const dailyLimit = profile?.dailySpendingLimit || 0;
  const dailyProfitLoss = dailyLimit - todaysSpending;

  const recentTransactions = transactions.slice(0, 7).reverse();
  const chartData = recentTransactions.map(t => ({
      date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short'}),
      amount: t.amount,
  }));

  if (!profile) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to Kwik Kash!</h2>
        <p className="text-muted-foreground mb-6">Please complete the onboarding to start managing your finances.</p>
        <Button asChild>
          <Link href="/onboarding">Start Onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Spending" 
          value={`₹${todaysSpending.toFixed(2)}`}
          icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
          change={dailyProfitLoss >= 0 ? `₹${dailyProfitLoss.toFixed(2)} under limit` : `₹${Math.abs(dailyProfitLoss).toFixed(2)} over limit`}
          changeType={dailyProfitLoss >= 0 ? 'increase' : 'decrease'}
        />
        <StatCard 
          title="Total Savings for Goals" 
          value={`₹${totalGoalSaved.toFixed(2)}`}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Monthly Income" 
          value={`₹${profile?.income.toFixed(2)}`}
          icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Fixed Expenses" 
          value={`₹${profile?.fixedExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`}
          icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`}/>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length > 0 ? goals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ₹{goal.currentAmount.toFixed(2)} / ₹{goal.targetAmount.toFixed(2)}
                  </span>
                </div>
                <Progress value={(goal.currentAmount / goal.targetAmount) * 100} />
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <p>You haven't set any goals yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/goals">Set a Goal</Link>
                </Button>
              </div>
            )}
            {goals.length > 0 && (
              <Button className="w-full mt-4" asChild>
                <Link href="/goals">Manage Goals</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
