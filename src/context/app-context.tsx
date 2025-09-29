
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, Goal, Transaction, FixedExpense, LoggedPayments, Contribution, EmergencyFundEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseApp from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format, formatISO, startOfDay, parseISO } from 'date-fns';

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  goals: Goal[];
  transactions: Transaction[];
  onboardingComplete: boolean;
  updateProfile: (profile: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => void;
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
  updateEmergencyFund: (action: 'deposit' | 'withdraw', amount: number, notes?: string) => void;
  setEmergencyFundTarget: (target: number) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const KART_I_QUO_PREFIX = 'kart-i-quo-';
const PROFILE_KEY = `${KART_I_QUO_PREFIX}profile`;
const GOALS_KEY = `${KART_I_QUO_PREFIX}goals`;
const TRANSACTIONS_KEY = `${KART_I_QUO_PREFIX}transactions`;
const LOGGED_PAYMENTS_KEY = `${KART_I_QUO_PREFIX}logged-payments`;

// --- Migration from old keys ---
const OLD_PREFIX = 'kwik-kash-'; 
const OLD_PROFILE_KEY = `${OLD_PREFIX}profile`;
const OLD_GOALS_KEY = `${OLD_PREFIX}goals`;
const OLD_TRANSACTIONS_KEY = `${OLD_PREFIX}transactions`;
const OLD_LOGGED_PAYMENTS_KEY = `${OLD_PREFIX}logged-payments`;

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loggedPayments, setLoggedPayments] = useState<LoggedPayments>({});
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    try {
      // --- Data Migration Logic ---
      const hasNewData = !!localStorage.getItem(PROFILE_KEY);
      if (!hasNewData) {
        const oldProfile = localStorage.getItem(OLD_PROFILE_KEY);
        if (oldProfile) {
          localStorage.setItem(PROFILE_KEY, oldProfile);
          localStorage.removeItem(OLD_PROFILE_KEY);
        }
        const oldGoals = localStorage.getItem(OLD_GOALS_KEY);
        if (oldGoals) {
          localStorage.setItem(GOALS_KEY, oldGoals);
          localStorage.removeItem(OLD_GOALS_KEY);
        }
        const oldTransactions = localStorage.getItem(OLD_TRANSACTIONS_KEY);
        if (oldTransactions) {
          localStorage.setItem(TRANSACTIONS_KEY, oldTransactions);
          localStorage.removeItem(OLD_TRANSACTIONS_KEY);
        }
        const oldLoggedPayments = localStorage.getItem(OLD_LOGGED_PAYMENTS_KEY);
        if (oldLoggedPayments) {
          localStorage.setItem(LOGGED_PAYMENTS_KEY, oldLoggedPayments);
          localStorage.removeItem(OLD_LOGGED_PAYMENTS_KEY);
        }
      }

      // --- Regular Data Loading ---
      const storedProfile = localStorage.getItem(PROFILE_KEY);
      const storedGoals = localStorage.getItem(GOALS_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      const storedLoggedPayments = localStorage.getItem(LOGGED_PAYMENTS_KEY);

      if (storedProfile) {
        let parsedProfile: UserProfile = JSON.parse(storedProfile);
        
        if (!parsedProfile.emergencyFund) {
            parsedProfile.emergencyFund = {
                target: 0,
                current: 0,
                history: [],
            };
        }
        
        const budget = calculateBudget(parsedProfile.income, parsedProfile.fixedExpenses);
        const updatedProfile = { ...parsedProfile, ...budget };

        if (JSON.stringify(parsedProfile) !== JSON.stringify(updatedProfile)) {
          persistState(PROFILE_KEY, updatedProfile);
        }
        setProfile(updatedProfile);


        if (updatedProfile && updatedProfile.role) {
            setOnboardingComplete(true);
        }
      }
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      } else {
        const initialContribution: Contribution = { amount: 5000, date: new Date().toISOString() };
        const initialGoal: Goal = {
          id: '1',
          name: 'New Laptop',
          targetAmount: 80000,
          currentAmount: 5000,
          monthlyContribution: 5000,
          timelineMonths: 16,
          startDate: formatISO(new Date()),
          contributions: [initialContribution],
        };
        setGoals([initialGoal]);
        persistState(GOALS_KEY, [initialGoal]);
      }
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        const initialTransaction: Transaction = {
          id: '1',
          amount: 150,
          category: 'Food & Dining',
          description: 'Lunch with friends',
          date: new Date().toISOString()
        };
        setTransactions([initialTransaction]);
        persistState(TRANSACTIONS_KEY, [initialTransaction]);
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
        emergencyFund: profile?.emergencyFund || { target: 0, current: 0, history: [] }
    } as UserProfile;
    
    setProfile(updatedProfile);
    setOnboardingComplete(true);
    persistState(PROFILE_KEY, updatedProfile);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      currentAmount: 0,
      startDate: goalData.timelineMonths ? formatISO(new Date()) : undefined,
      contributions: [],
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
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
    persistState(TRANSACTIONS_KEY, newTransactions);
  };

  const updateGoal = (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    const newGoals = goals.map(g => 
        g.id === goalId ? { ...g, ...updatedData, startDate: (g.timelineMonths && !g.startDate) ? formatISO(new Date()) : g.startDate } : g
    );
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
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
    persistState(TRANSACTIONS_KEY, newTransactions);
    toast({
        title: 'Transaction Updated',
        description: 'Your expense has been successfully updated.',
    });
  };

  const deleteTransaction = (transactionId: string) => {
    const newTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(newTransactions);
    persistState(TRANSACTIONS_KEY, newTransactions);
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
    const newContribution: Contribution = {
        amount,
        date: new Date().toISOString(),
    };

    const newGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrentAmount = goal.currentAmount + amount;
        return { 
            ...goal, 
            currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
            contributions: [newContribution, ...(goal.contributions || [])],
         };
      }
      return goal;
    });
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
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
    persistState(LOGGED_PAYMENTS_KEY, updatedLoggedPayments);
  };

  const updateEmergencyFund = (action: 'deposit' | 'withdraw', amount: number, notes?: string) => {
    if (!profile) return;

    const newEntry: EmergencyFundEntry = {
        id: Date.now().toString(),
        amount,
        date: new Date().toISOString(),
        type: action === 'deposit' ? 'deposit' : 'withdrawal',
        notes,
    };

    const newCurrent = action === 'deposit' 
        ? profile.emergencyFund.current + amount 
        : profile.emergencyFund.current - amount;

    const updatedProfile: UserProfile = {
        ...profile,
        emergencyFund: {
            ...profile.emergencyFund,
            current: newCurrent < 0 ? 0 : newCurrent,
            history: [newEntry, ...profile.emergencyFund.history],
        },
    };

    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
    toast({
        title: `Fund ${action === 'deposit' ? 'Added' : 'Withdrawn'}`,
        description: `₹${amount.toFixed(2)} has been ${action === 'deposit' ? 'added to' : 'withdrawn from'} your emergency fund.`,
    });
  };

  const setEmergencyFundTarget = (target: number) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
        ...profile,
        emergencyFund: {
            ...profile.emergencyFund,
            target,
        },
    };
    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
     toast({
        title: `Target Updated`,
        description: `Your new emergency fund target is ₹${target.toFixed(2)}.`,
    });
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
    user,
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
    updateEmergencyFund,
    setEmergencyFundTarget,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
