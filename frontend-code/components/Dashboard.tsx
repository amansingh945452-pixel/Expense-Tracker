"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, SummaryResponse, Transaction } from "@/types";
import { getCategories, getSummary, getTransactions } from "@/lib/api";
import { TransactionForm } from "@/components/TransactionForm";
import { SpendingChart } from "@/components/SpendingChart";

// --- Your custom components -------------------------------------------
// These are assumed to already exist in /components and /components/ui.
// Adjust the import paths/prop names to match your actual files.
import { CloudShader } from "@/components/CloudShader";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { LoaderOne } from "@/components/ui/loader";

const GREETING_WORDS = ["Track Your Expenses", "Track Your Income", "Track Your Savings"];

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, sum, txns] = await Promise.all([
        getCategories(),
        getSummary(),
        getTransactions({ limit: 10 }),
      ]);
      setCategories(cats);
      setSummary(sum);
      setTransactions(txns.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the API — is the Flask server running?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Top spending categories -> cards for the carousel
  const topCategoryCards =
    summary?.by_category.slice(0, 5).map((c, i) => (
      <Card
        key={c.category_id}
        card={{
          category: c.category_name,
          title: `$${c.total_amount.toFixed(2)}`,
          src: undefined,
          content: (
            <p className="text-sm text-white/80">
              {c.transaction_count} transaction{c.transaction_count === 1 ? "" : "s"} in{" "}
              {c.category_name}. That's currently your #{i + 1} spending category.
            </p>
          ),
        }}
        index={i}
      />
    )) ?? [];

  return (
    <CloudShader className="min-h-screen w-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        {/* Header */}
        <header className="flex flex-col items-center gap-3 text-center">
          <LayoutTextFlip words={GREETING_WORDS} className="text-3xl font-bold text-white sm:text-5xl" />
          <p className="max-w-lg text-sm text-white/70">
            A live view of where your money goes — add a transaction below and watch
            the chart update instantly.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <LoaderOne />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-red-200 backdrop-blur-md">
            {error}
          </div>
        ) : (
          <>
            {/* Chart + Form */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <SpendingChart
                  data={summary?.by_category ?? []}
                  grandTotal={summary?.grand_total ?? 0}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionForm categories={categories} onCreated={loadDashboard} />
              </div>
            </div>

            {/* Top categories carousel */}
            {topCategoryCards.length > 0 && (
              <section>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Top Spending Categories
                </h3>
                <Carousel items={topCategoryCards} />
              </section>
            )}

            {/* Recent transactions */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-white">Recent Transactions</h3>
              <div className="flex flex-col divide-y divide-white/10">
                {transactions.length === 0 && (
                  <p className="py-4 text-sm text-white/60">No transactions yet.</p>
                )}
                {transactions.map((t) => (
                  <div key={t.transaction_id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.category_name}
                        <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-white/60">
                          {t.cost_type}
                        </span>
                      </p>
                      <p className="text-xs text-white/50">
                        {t.transaction_date} {t.description ? `· ${t.description}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      ${t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </CloudShader>
  );
}
