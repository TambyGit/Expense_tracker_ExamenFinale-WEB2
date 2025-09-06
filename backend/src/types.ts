export interface Expense {
  id: number; 
  user_id: number;
  title: string;
  amount: number; 
  category: string;
  description: string | null;
  date: string; 
  created_at: string;
  updated_at: string;
}