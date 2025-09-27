
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, Goal, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import firebaseApp from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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
  contributeToGoals: () => void;
  lastContributionDate: string | null;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [lastContributionDate, setLastContributionDate] = useState<string | null>(null);


  useEffect(() => {
    // Attempt to load data from localStorage to persist state
    try {
      const storedProfile = localStorage.getItem('kwik-kash-profile');
      const storedGoals = localStorage.getItem('kwik-kash-goals');
      const storedTransactions = localStorage.getItem('kwik-kash-transactions');
      const storedLastContribution = localStorage.getItem('kwik-kash-last-contribution-date');

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        if (parsedProfile && parsedProfile.role) {
            setOnboardingComplete(true);
        }
      }
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      if (storedLastContribution) {
        setLastContributionDate(storedLastContribution);
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
    const updatedProfile = { ...profile, ...newProfileData } as UserProfile;
    setProfile(updatedProfile);
    setOnboardingComplete(true);
    persistState('kwik-kash-profile', updatedProfile);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      currentAmount: 0,
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
        g.id === goalId ? { ...g, ...updatedData } : g
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

  const contributeToGoals = () => {
    const now = new Date();
    const lastDate = lastContributionDate ? new Date(lastContributionDate) : null;

    if (lastDate && lastDate.getFullYear() === now.getFullYear() && lastDate.getMonth() === now.getMonth()) {
      toast({
        variant: "destructive",
        title: "Contribution already made",
        description: "You have already made your goal contributions for this month.",
      });
      return;
    }

    const totalContribution = getTotalGoalContributions();
    if (profile && (profile.monthlySavings - totalContribution < 0) ) {
      toast({
        variant: "destructive",
        title: "Not enough savings",
        description: "Your monthly goal contributions exceed your total available savings.",
      });
      return;
    }

    const newGoals = goals.map(goal => ({
      ...goal,
      currentAmount: goal.currentAmount + goal.monthlyContribution,
    }));

    setGoals(newGoals);
    const todayStr = now.toISOString();
    setLastContributionDate(todayStr);
    persistState('kwik-kash-goals', newGoals);
    persistState('kwik-kash-last-contribution-date', todayStr);

    toast({
      title: "Goals Updated!",
      description: `You've contributed ₹${totalContribution.toFixed(2)} to your goals.`,
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
    localStorage.removeItem('kwik-kash-last-contribution-date');
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
    contributeToGoals,
    lastContributionDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
