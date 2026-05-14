"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { habits } from "@/lib/api";
import type { HabitWithProgress } from "@/lib/api";
import { CheckCircle2, Circle, Loader2, Plus, Flame } from "lucide-react";

export default function HabitsPage() {
  const [data, setData] = useState<HabitWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setData(await habits.today()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggle(habitId: string, currentlyDone: boolean) {
    setLogging(habitId);
    try {
      const today = new Date().toISOString().split("T")[0];
      await habits.log(habitId, today, !currentlyDone);
      await load();
    } finally {
      setLogging(null);
    }
  }

  const done = data.filter((h) => h.completed_today).length;

  return (
    <Shell>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Habits</h1>
            <p className="text-zinc-500 text-sm">{done}/{data.length} done today</p>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Flame size={18} />
            <span className="text-sm font-bold">{done}</span>
          </div>
        </div>

        {/* Progress bar */}
        {data.length > 0 && (
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${data.length ? (done / data.length) * 100 : 0}%` }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-600" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">No habits yet.</p>
            <button className="mt-3 text-violet-400 text-sm flex items-center gap-1 mx-auto">
              <Plus size={16} /> Add your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(({ habit, completed_today, week_progress }) => (
              <button
                key={habit.id}
                onClick={() => toggle(habit.id, completed_today)}
                disabled={logging === habit.id}
                className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors active:scale-[0.99]"
              >
                <div className="shrink-0">
                  {logging === habit.id ? (
                    <Loader2 size={24} className="animate-spin text-violet-400" />
                  ) : completed_today ? (
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  ) : (
                    <Circle size={24} className="text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-medium truncate ${completed_today ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                    {habit.name}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {week_progress} this week
                  </p>
                </div>
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
