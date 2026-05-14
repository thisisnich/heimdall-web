"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { brief, habits, todos, budget, health } from "@/lib/api";
import type { HabitWithProgress, TodoResponse, BudgetSummary } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Loader2, RefreshCw, CheckCircle2, Circle, AlertTriangle, Sun, Moon } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function HomePage() {
  console.log("[HomePage] Component rendering START");
  const { username } = useAuthStore();
  console.log("[HomePage] Username:", username);
  const [briefText, setBriefText] = useState("");
  const [briefType, setBriefType] = useState<"morning" | "evening">("morning");
  const [briefLoading, setBriefLoading] = useState(false);
  const [todayHabits, setTodayHabits] = useState<HabitWithProgress[]>([]);
  const [todayTodos, setTodayTodos] = useState<TodoResponse[]>([]);
  const [allPendingTodos, setAllPendingTodos] = useState<TodoResponse[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  console.log("[HomePage] Component rendering END, state initialized");

  useEffect(() => {
    console.log("[HomePage] useEffect running");
    health.check()
      .then(() => { console.log("[HomePage] Health check passed"); setServerOk(true); })
      .catch((e) => { console.error("[HomePage] Health check failed:", e); setServerOk(false); });
    habits.today()
      .then((h) => { console.log("[HomePage] Habits loaded:", h.length); setTodayHabits(h); })
      .catch((e) => { console.error("[HomePage] Habits failed:", e); });
    todos.today()
      .then((t) => { console.log("[HomePage] Today todos loaded:", t.length); setTodayTodos(t); })
      .catch((e) => { console.error("[HomePage] Today todos failed:", e); });
    todos.list({ status: "pending" })
      .then((t) => { console.log("[HomePage] Pending todos loaded:", t.length); setAllPendingTodos(t); })
      .catch((e) => { console.error("[HomePage] Pending todos failed:", e); });
    budget.summary()
      .then((b) => { console.log("[HomePage] Budget loaded"); setBudgetSummary(b); })
      .catch((e) => { console.error("[HomePage] Budget failed:", e); });
  }, []);

  async function loadBrief() {
    setBriefLoading(true);
    try {
      const res = await brief.get();
      setBriefText(res.brief);
      setBriefType(res.brief_type);
    } catch {
      setBriefText("Failed to load brief. Check server connection.");
    } finally {
      setBriefLoading(false);
    }
  }

  const completedHabits = todayHabits.filter((h) => h.completed_today).length;
  const pendingTodos = allPendingTodos.length;

  console.log("[HomePage] About to render, serverOk:", serverOk, "habits:", todayHabits.length, "todos:", todayTodos.length);

  return (
    <Shell>
      <div className="px-4 pt-8 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Hey, {username ?? "Nicholas"} 👋</h1>
            <p className="text-zinc-500 text-sm">
              {new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${serverOk === null ? "bg-zinc-600" : serverOk ? "bg-emerald-400" : "bg-red-400"}`}
            title={serverOk ? "Server online" : "Server offline"}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <p className="text-xs text-zinc-500">Habits</p>
            <p className="text-xl font-bold text-violet-400">{completedHabits}/{todayHabits.length}</p>
            <p className="text-[10px] text-zinc-600">today</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <p className="text-xs text-zinc-500">Todos</p>
            <p className="text-xl font-bold text-amber-400">{pendingTodos}</p>
            <p className="text-[10px] text-zinc-600">pending</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <p className="text-xs text-zinc-500">Net</p>
            <p className={`text-xl font-bold ${budgetSummary && budgetSummary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {budgetSummary ? `$${budgetSummary.net.toFixed(0)}` : "—"}
            </p>
            <p className="text-[10px] text-zinc-600">this month</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {briefType === "morning" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-400" />}
              <h2 className="text-sm font-semibold text-zinc-300">{briefType === "morning" ? "Morning Brief" : "Evening Wrap-up"}</h2>
            </div>
            <button onClick={loadBrief} disabled={briefLoading} className="text-zinc-500 hover:text-violet-400 transition-colors">
              {briefLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
          </div>
          {briefText ? (
            <div className="brief-md text-sm text-zinc-400 leading-relaxed">
              <ReactMarkdown>{briefText}</ReactMarkdown>
            </div>
          ) : (
            <button onClick={loadBrief} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
              Tap to generate today&apos;s brief →
            </button>
          )}
        </div>

        {todayHabits.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-300">Today&apos;s Habits</h2>
              <Link href="/habits" className="text-xs text-violet-400">See all</Link>
            </div>
            <div className="space-y-2">
              {todayHabits.slice(0, 5).map(({ habit, completed_today }) => (
                <div key={habit.id} className="flex items-center gap-3">
                  {completed_today
                    ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    : <Circle size={18} className="text-zinc-600 shrink-0" />}
                  <span className={`text-sm ${completed_today ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                    {habit.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {todayTodos.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-300">Due Today</h2>
              <Link href="/goals" className="text-xs text-violet-400">See all</Link>
            </div>
            <div className="space-y-2">
              {todayTodos.slice(0, 5).map((todo) => (
                <div key={todo.id} className="flex items-center gap-3">
                  {todo.status === "completed"
                    ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    : todo.priority === 1
                    ? <AlertTriangle size={18} className="text-red-400 shrink-0" />
                    : <Circle size={18} className="text-zinc-600 shrink-0" />}
                  <span className={`text-sm ${todo.status === "completed" ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/chat" className="bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 rounded-xl p-4 transition-colors">
            <p className="text-sm font-medium text-violet-300">Ask Heimdall</p>
            <p className="text-xs text-violet-400/60 mt-0.5">Chat with your AI</p>
          </Link>
          <Link href="/ingest" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 transition-colors">
            <p className="text-sm font-medium text-zinc-300">Ingest</p>
            <p className="text-xs text-zinc-500 mt-0.5">Add files, URLs, photos</p>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
