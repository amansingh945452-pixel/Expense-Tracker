export type CostType = "fixed" | "variable";
export type TransactionType = "expense" | "income";

export interface Category {
  category_id: number;
  name: string;
  type: TransactionType;
  icon: string | null;
  color_hex: string | null;
}

export interface Transaction {
  transaction_id: number;
  category_id: number;
  category_name: string;
  color_hex: string | null;
  amount: number;
  transaction_date: string; // ISO date
  description: string | null;
  cost_type: CostType;
  transaction_type: TransactionType;
  created_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface SummaryByCategory {
  category_id: number;
  category_name: string;
  color_hex: string | null;
  total_amount: number;
  transaction_count: number;
}

export interface SummaryByCostType {
  cost_type: CostType;
  total_amount: number;
}

export interface SummaryResponse {
  by_category: SummaryByCategory[];
  by_cost_type: SummaryByCostType[];
  grand_total: number;
}

export interface NewTransactionInput {
  category_id: number;
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  description?: string;
  cost_type: CostType;
  transaction_type: TransactionType;
}
