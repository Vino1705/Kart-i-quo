
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, Goal, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import firebaseApp from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { formatISO } from 'date-fns';

interface AppContextType {
  profile: UserProfile | null;
  goals: Goal[];
  transactions: Transaction[];
  onboardingComplete: boolean;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  updateGoal: (goalId: string, updatedGoal: Partial<Omit<Goal, 'id'>>) => void;
  getTodaysSpending: () => number;
  logout: () => void;
  updateTransaction: (transactionId: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'date'>>) => void;
  deleteTransaction: (transactionId: string) => void;
  getTotalGoalContributions: () => number;
  contributeToGoal: (goalId: string, amount: number) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Attempt to load data from localStorage to persist state
    try {
      const storedProfile = localStorage.getItem('kwik-kash-profile');
      const storedGoals = localStorage.getItem('kwik-kash-goals');
      const storedTransactions = localStorage.getItem('kwik-kash-transactions');

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
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

  const updateProfile = (newProfileData: Partial<UserProfile>) => {
    const income = newProfileData.income ?? profile?.income ?? 0;
    const fixedExpenses = newProfileData.fixedExpenses ?? profile?.fixedExpenses ?? [];
    
    const needs = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const disposableIncome = income - needs;
    
    const wants = disposableIncome * 0.6;
    const savings = disposableIncome * 0.4;
    const daily = wants > 0 ? wants / 30 : 0;

    const updatedProfile = { 
        ...profile, 
        ...newProfileData,
        monthlyNeeds: needs,
        monthlyWants: wants,
        monthlySavings: savings,
        dailySpendingLimit: daily,
    } as UserProfile;
    
    setProfile(updatedProfile);
    if(newProfileData.goals) {
      setGoals(newProfileData.goals);
    }
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

    const todaysSpending = getTodaysSpending() + newTransaction.amount;
    if (profile && todaysSpending > profile.dailySpendingLimit) {
        toast({
            variant: "destructive",
            title: 'Daily Limit Exceeded!',
            description: `You've spent ₹${todaysSpending.toFixed(2)} today, which is over your ₹${profile.dailySpendingLimit.toFixed(2)} limit.`,
        });
    }
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

  const logout = async () => {
    const auth = getAuth(firebaseApp);
    await signOut(auth);
    setProfile(null);
    setGoals([]);
    setTransactions([]);
    setOnboardingComplete(false);
    localStorage.removeItem('kwik-kash-profile');
    localStorage.removeItem('kwik-kash-goals');
    localStorage.removeItem('kwik-kash-transactions');
    router.push('/login');
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
