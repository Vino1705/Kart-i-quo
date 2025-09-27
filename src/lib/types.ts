export type UserRole = 'Student' | 'Professional' | 'Housewife' | '';

export interface UserProfile {
  role: UserRole;
  income: number;
  fixedExpenses: FixedExpense[];
  dailySpendingLimit: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  timelineMonths: number;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string for simplicity
}

export const expenseCategories = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Rent/EMI',
  'Healthcare',
  'Education',
  'Other',
];
