"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { budget } from "@/lib/api";
import type { BudgetSummary, TransactionResponse } from "@/lib/api";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [txns, setTxns] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, t] = await Promise.all([
          budget.summary(year, month),
          budget.transactions({ limit: 30 }),
        ]);
        setSummary(s);
        setTxns(t);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, month]);

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const categories = summary ? Object.values(summary.category_breakdown) : [];

  return (
    <Shell>
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Header + month nav */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-100">Budget</h1>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-zinc-300 px-2">‹</button>
            <span className="text-zinc-300 font-medium w-16 text-center">{MONTHS[month - 1]} {year}</span>
            <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-zinc-300 px-2">›</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-600" /></div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span className="text-xs text-zinc-500">Income</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">SGD {summary.income.toFixed(2)}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-red-400" />
                    <span className="text-xs text-zinc-500">Expenses</span>
                  </div>
                  <p className="text-xl font-bold text-red-400">SGD {summary.expenses.toFixed(2)}</p>
                </div>
                <div className={`col-span-2 border rounded-xl p-4 ${summary.net >= 0 ? "bg-emerald-900/20 border-emerald-800" : "bg-red-900/20 border-red-800"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Minus size={16} className={summary.net >= 0 ? "text-emerald-400" : "text-red-400"} />
                    <span className="text-xs text-zinc-400">Net ({summary.transaction_count} transactions)</span>
                  </div>
                  <p className={`text-2xl font-bold ${summary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    SGD {summary.net.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Category breakdown */}
            {categories.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-zinc-300">Categories</h2>
                {categories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cat.alert && <AlertTriangle size={12} className="text-amber-400" />}
                        <span className="text-xs text-zinc-400">{cat.name}</span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        SGD {cat.spent.toFixed(2)}{cat.limit ? ` / ${cat.limit.toFixed(0)}` : ""}
                        {cat.percent_used !== null && cat.percent_used !== undefined && (
                          <span className={`ml-1 ${cat.alert ? "text-amber-400" : "text-zinc-600"}`}>
                            ({cat.percent_used.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    {cat.limit && (
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cat.alert ? "bg-amber-500" : "bg-violet-500"}`}
                          style={{ width: `${Math.min(cat.percent_used ?? 0, 100)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent transactions */}
            {txns.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
                <h2 className="text-sm font-semibold text-zinc-300 mb-3">Recent Transactions</h2>
                {txns.slice(0, 15).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{t.description}</p>
                      <p className="text-xs text-zinc-600">{t.transaction_date}{t.merchant ? ` · ${t.merchant}` : ""}</p>
                    </div>
                    <p className={`text-sm font-medium shrink-0 ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.type === "income" ? "+" : "-"}SGD {t.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {txns.length === 0 && categories.length === 0 && (
              <p className="text-center text-zinc-600 text-sm py-10">No transactions this month</p>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
