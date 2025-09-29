
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, Goal, Transaction, FixedExpense, LoggedPayments } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import firebaseApp from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format, formatISO, startOfDay, parseISO } from 'date-fns';

interface AppContextType {
  profile: UserProfile | null;
  goals: Goal[];
  transactions: Transaction[];
  onboardingComplete: boolean;
  updateProfile: (profile: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  updateGoal: (goalId: string, updatedGoal: Partial<Omit<Goal, 'id'>>) => void;
  getTodaysSpending: () => number;
  logout: () => void;
  updateTransaction: (transactionId: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'date'>>) => void;
  deleteTransaction: (transactionId: string) => void;
  getTotalGoalContributions: () => number;
  contributeToGoal: (goalId: string, amount: number) => void;
  getCumulativeDailySavings: () => number;
  toggleFixedExpenseLoggedStatus: (expenseId: string) => void;
  isFixedExpenseLoggedForCurrentMonth: (expenseId: string) => boolean;
  getLoggedPaymentCount: (expenseId: string) => number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const calculateBudget = (income: number, fixedExpenses: { amount: number }[]): Pick<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'> => {
    const needs = fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const disposableIncome = income - needs;
    
    const wants = disposableIncome * 0.6;
    const savings = disposableIncome * 0.4;
    const daily = wants > 0 ? wants / 30 : 0;

    return {
        monthlyNeeds: needs,
        monthlyWants: wants,
        monthlySavings: savings,
        dailySpendingLimit: daily,
    };
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loggedPayments, setLoggedPayments] = useState<LoggedPayments>({});
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Attempt to load data from localStorage to persist state
    try {
      const storedProfile = localStorage.getItem('kwik-kash-profile');
      const storedGoals = localStorage.getItem('kwik-kash-goals');
      const storedTransactions = localStorage.getItem('kwik-kash-transactions');
      const storedLoggedPayments = localStorage.getItem('kwik-kash-logged-payments');

      if (storedProfile) {
        const parsedProfile: UserProfile = JSON.parse(storedProfile);
        
        // Always recalculate budget to ensure consistency with current logic
        const budget = calculateBudget(parsedProfile.income, parsedProfile.fixedExpenses);
        const updatedProfile = { ...parsedProfile, ...budget };

        if (JSON.stringify(parsedProfile) !== JSON.stringify(updatedProfile)) {
          persistState('kwik-kash-profile', updatedProfile); // Persist corrected profile
        }
        setProfile(updatedProfile);


        if (parsedProfile && parsedProfile.role) {
            setOnboardingComplete(true);
        }
      }
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      } else {
        // Set initial goal for demo purposes if none exist
        const initialGoal: Goal = {
          id: '1',
          name: 'New Laptop',
          targetAmount: 80000,
          currentAmount: 5000,
          monthlyContribution: 5000,
          timelineMonths: 16,
          startDate: formatISO(new Date()),
        };
        setGoals([initialGoal]);
        persistState('kwik-kash-goals', [initialGoal]);
      }
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        // Set initial transaction for demo purposes
        const initialTransaction: Transaction = {
          id: '1',
          amount: 150,
          category: 'Food & Dining',
          description: 'Lunch with friends',
          date: new Date().toISOString()
        };
        setTransactions([initialTransaction]);
        persistState('kwik-kash-transactions', [initialTransaction]);
      }
      if (storedLoggedPayments) {
        setLoggedPayments(JSON.parse(storedLoggedPayments));
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const persistState = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to persist ${key} to localStorage`, error);
    }
  };

  const updateProfile = (newProfileData: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => {
    const income = newProfileData.income ?? profile?.income ?? 0;
    const fixedExpenses = newProfileData.fixedExpenses?.map(exp => ({
        ...exp,
        id: exp.id || Math.random().toString(),
        startDate: (exp.timelineMonths && !exp.startDate) ? formatISO(new Date()) : exp.startDate
    })) ?? profile?.fixedExpenses ?? [];
    
    const budget = calculateBudget(income, fixedExpenses);

    const updatedProfile: UserProfile = { 
        ...profile, 
        ...newProfileData,
        fixedExpenses,
        ...budget,
    } as UserProfile;
    
    setProfile(updatedProfile);
    setOnboardingComplete(true);
    persistState('kwik-kash-profile', updatedProfile);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      currentAmount: 0,
      startDate: goalData.timelineMonths ? formatISO(new Date()) : undefined,
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    persistState('kwik-kash-goals', newGoals);
    toast({
      title: 'Goal Added!',
      description: `You're now saving for "${newGoal.name}".`,
    });
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const newTransactions = [newTransaction, ...transactions];
    setTransactions(newTransactions);
    persistState('kwik-kash-transactions', newTransactions);
  };

  const updateGoal = (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    const newGoals = goals.map(g => 
        g.id === goalId ? { ...g, ...updatedData, startDate: (g.timelineMonths && !g.startDate) ? formatISO(new Date()) : g.startDate } : g
    );
    setGoals(newGoals);
    persistState('kwik-kash-goals', newGoals);
    toast({
        title: 'Goal Updated',
        description: 'Your goal has been successfully updated.',
    });
  };
  
  const updateTransaction = (transactionId: string, updatedData: Partial<Omit<Transaction, 'id' | 'date'>>) => {
    const newTransactions = transactions.map(t =>
      t.id === transactionId ? { ...t, ...updatedData } : t
    );
    setTransactions(newTransactions);
    persistState('kwik-kash-transactions', newTransactions);
    toast({
        title: 'Transaction Updated',
        description: 'Your expense has been successfully updated.',
    });
  };

  const deleteTransaction = (transactionId: string) => {
    const newTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(newTransactions);
    persistState('kwik-kash-transactions', newTransactions);
    toast({
        title: 'Transaction Deleted',
        description: 'Your expense has been removed.',
    });
  };

  const getTodaysSpending = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalGoalContributions = () => {
    return goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
  }

  const getCumulativeDailySavings = () => {
    if (!profile || transactions.length === 0) {
      return 0;
    }

    const spendingByDay = transactions
      .reduce((acc, t) => {
        const day = startOfDay(parseISO(t.date)).toISOString();
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
    
    const today = startOfDay(new Date()).toISOString();

    let cumulativeSavings = 0;
    for (const day in spendingByDay) {
      // Do not include today's savings in the cumulative total, as it's still ongoing
      if (day !== today) {
        const spending = spendingByDay[day];
        const saving = profile.dailySpendingLimit - spending;
        if (saving > 0) {
            cumulativeSavings += saving;
        }
      }
    }

    return cumulativeSavings;
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    const newGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrentAmount = goal.currentAmount + amount;
        return { ...goal, currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount };
      }
      return goal;
    });
    setGoals(newGoals);
    persistState('kwik-kash-goals', newGoals);
    toast({
      title: 'Contribution Successful!',
      description: `You've added ₹${amount.toFixed(2)} to your goal.`,
    });
  };

  const isFixedExpenseLoggedForCurrentMonth = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    return loggedPayments[expenseId]?.includes(currentMonthKey) || false;
  };
  
  const getLoggedPaymentCount = (expenseId: string) => {
    return loggedPayments[expenseId]?.length || 0;
  };

  const toggleFixedExpenseLoggedStatus = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const existingLogs = loggedPayments[expenseId] || [];
    const isLogged = existingLogs.includes(currentMonthKey);
    
    let newLogs;
    if (isLogged) {
      newLogs = existingLogs.filter(month => month !== currentMonthKey);
      toast({ title: 'Expense marked as unpaid.' });
    } else {
      newLogs = [...existingLogs, currentMonthKey];
      toast({ title: 'Expense marked as paid.' });
    }

    const updatedLoggedPayments = {
      ...loggedPayments,
      [expenseId]: newLogs,
    };
    
    setLoggedPayments(updatedLoggedPayments);
    persistState('kwik-kash-logged-payments', updatedLoggedPayments);
  };


  const logout = async () => {
    const auth = getAuth(firebaseApp);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
       console.error("Logout failed", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
       })
    }
  }

  const value = {
    profile,
    goals,
    transactions,
    onboardingComplete,
    updateProfile,
    addGoal,
    addTransaction,
    updateGoal,
    getTodaysSpending,
    logout,
    updateTransaction,
    deleteTransaction,
    getTotalGoalContributions,
    contributeToGoal,
    getCumulativeDailySavings,
    toggleFixedExpenseLoggedStatus,
    isFixedExpenseLoggedForCurrentMonth,
    getLoggedPaymentCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
