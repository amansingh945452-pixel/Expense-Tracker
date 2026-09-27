"use client";

import { useState } from "react";
import type { Category, CostType, NewTransactionInput } from "@/types";
import { createTransaction } from "@/lib/api";

// Custom button component — assumed to live at components/ui/custom-button.
// Swap this import for whatever your actual file/exports are named.
import { CustomButton } from "@/components/ui/custom-button";

interface TransactionFormProps {
  categories: Category[];
  onCreated: () => void; // parent refetches summary/list after a successful add
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ categories, onCreated }: TransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>(
    categories[0] ? String(categories[0].category_id) : ""
  );
  const [date, setDate] = useState(todayISO());
  const [costType, setCostType] = useState<CostType>("variable");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!categoryId || Number.isNaN(parsedAmount) || parsedAmount < 0 || !date) {
      setError("Please fill in a valid amount, category, and date.");
      return;
    }

    const payload: NewTransactionInput = {
      amount: parsedAmount,
      category_id: Number(categoryId),
      transaction_date: date,
      description: description.trim() || undefined,
      cost_type: costType,
      transaction_type: "expense",
    };

    try {
      setSubmitting(true);
      await createTransaction(payload);
      setAmount("");
      setDescription("");
      setCostType("variable");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md"
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Add a Transaction</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-white/40 [&>option]:bg-slate-800"
          >
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-white/40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Cost Type</label>
          <div className="flex overflow-hidden rounded-lg border border-white/20">
            {(["fixed", "variable"] as CostType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCostType(option)}
                className={`flex-1 px-3 py-2 text-sm capitalize transition ${
                  costType === option
                    ? "bg-white/30 text-white"
                    : "bg-transparent text-white/60 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm text-white/80">Note</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Weekly groceries"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/40"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-5">
        <CustomButton type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Submit"}
        </CustomButton>
      </div>
    </form>
  );
}
