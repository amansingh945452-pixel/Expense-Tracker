import type {
  Category,
  NewTransactionInput,
  SummaryResponse,
  Transaction,
  TransactionListResponse,
} from "@/types";

// Set NEXT_PUBLIC_API_BASE_URL in .env.local — defaults to the local Flask dev server.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getCategories(userId = 1): Promise<Category[]> {
  return request<Category[]>(`/api/categories?user_id=${userId}`);
}

export function getTransactions(params?: {
  userId?: number;
  limit?: number;
  offset?: number;
  costType?: "fixed" | "variable";
}): Promise<TransactionListResponse> {
  const search = new URLSearchParams();
  search.set("user_id", String(params?.userId ?? 1));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  if (params?.costType) search.set("cost_type", params.costType);
  return request<TransactionListResponse>(`/api/transactions?${search.toString()}`);
}

export function getSummary(params?: {
  userId?: number;
  start?: string;
  end?: string;
}): Promise<SummaryResponse> {
  const search = new URLSearchParams();
  search.set("user_id", String(params?.userId ?? 1));
  if (params?.start) search.set("start", params.start);
  if (params?.end) search.set("end", params.end);
  return request<SummaryResponse>(`/api/summary?${search.toString()}`);
}

export function createTransaction(
  input: NewTransactionInput,
  userId = 1
): Promise<Transaction> {
  return request<Transaction>(`/api/transactions`, {
    method: "POST",
    body: JSON.stringify({ ...input, user_id: userId }),
  });
}
export async function deleteTransaction(transactionId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete transaction");
  }
}