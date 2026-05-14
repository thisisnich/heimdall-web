"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { goals, todos } from "@/lib/api";
import type { GoalResponse, TodoResponse } from "@/lib/api";
import { Loader2, CheckCircle2, Circle, Target, ChevronRight, AlertTriangle } from "lucide-react";

type Tab = "goals" | "todos";

export default function GoalsPage() {
  const [tab, setTab] = useState<Tab>("todos");
  const [goalList, setGoalList] = useState<GoalResponse[]>([]);
  const [todoList, setTodoList] = useState<TodoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [g, t] = await Promise.all([
          goals.list({ status: "in_progress" }),
          todos.list({ status: "pending" }),
        ]);
        setGoalList(g);
        setTodoList(t);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function completeTodo(id: string) {
    setCompleting(id);
    try {
      await todos.complete(id);
      setTodoList((prev) => prev.map((t) => t.id === id ? { ...t, status: "completed" } : t));
    } finally {
      setCompleting(null);
    }
  }

  const PRIORITY_LABEL: Record<number, string> = { 1: "High", 2: "Medium", 3: "Low" };
  const PRIORITY_COLOR: Record<number, string> = { 1: "text-red-400", 2: "text-amber-400", 3: "text-zinc-500" };

  return (
    <Shell>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <h1 className="text-xl font-bold text-zinc-100">Goals & Todos</h1>

        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {(["todos", "goals"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors capitalize ${
                tab === t ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t} {t === "todos" ? `(${todoList.filter(x => x.status !== "completed").length})` : `(${goalList.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-600" /></div>
        ) : tab === "todos" ? (
          <div className="space-y-2">
            {todoList.length === 0 && (
              <p className="text-center text-zinc-600 text-sm py-10">All clear 🎉</p>
            )}
            {todoList.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <button onClick={() => completeTodo(todo.id)} disabled={completing === todo.id || todo.status === "completed"}>
                  {completing === todo.id ? (
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                  ) : todo.status === "completed" ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : todo.priority === 1 ? (
                    <AlertTriangle size={20} className="text-red-400" />
                  ) : (
                    <Circle size={20} className="text-zinc-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${todo.status === "completed" ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
                    {todo.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium ${PRIORITY_COLOR[todo.priority]}`}>
                      {PRIORITY_LABEL[todo.priority]}
                    </span>
                    {todo.due_date && (
                      <span className="text-[10px] text-zinc-600">{todo.due_date}</span>
                    )}
                    {todo.category !== "general" && (
                      <span className="text-[10px] text-zinc-700 capitalize">{todo.category}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {goalList.length === 0 && (
              <p className="text-center text-zinc-600 text-sm py-10">No active goals</p>
            )}
            {goalList.map((goal) => (
              <div key={goal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: goal.color + "30" }}>
                    <Target size={16} style={{ color: goal.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{goal.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 capitalize">{goal.category} · {goal.timeframe.replace("_", " ")}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Progress</span>
                    <span className="text-zinc-400">{goal.progress_percent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${goal.progress_percent}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  {goal.current_value !== undefined && goal.target_value !== undefined && (
                    <p className="text-[10px] text-zinc-600">
                      {goal.current_value} / {goal.target_value} {goal.unit ?? ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
