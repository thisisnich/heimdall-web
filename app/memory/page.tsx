"use client";
import { useEffect, useState, useMemo } from "react";
import Shell from "@/components/Shell";
import { memory } from "@/lib/api";
import { Search, Brain, FileText, Tag, X, ChevronDown, ChevronUp, Loader2, RefreshCw, Cpu, Plus } from "lucide-react";

interface MemoryEntry {
  id: string;
  text: string;
  source_type: string;
  source_path?: string;
  created_at?: string;
}

const TYPE_COLORS: Record<string, string> = {
  preference:  "bg-violet-900/40 text-violet-300 border-violet-700",
  chat_input:  "bg-blue-900/40 text-blue-300 border-blue-700",
  fact:        "bg-amber-900/40 text-amber-300 border-amber-700",
  goal:        "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  idea:        "bg-pink-900/40 text-pink-300 border-pink-700",
  note:        "bg-zinc-800 text-zinc-300 border-zinc-600",
  study:       "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  person:      "bg-orange-900/40 text-orange-300 border-orange-700",
  event:       "bg-teal-900/40 text-teal-300 border-teal-700",
  media:       "bg-purple-900/40 text-purple-300 border-purple-700",
  reference:   "bg-indigo-900/40 text-indigo-300 border-indigo-700",
};

function typeColor(t: string) {
  return TYPE_COLORS[t] ?? "bg-zinc-800 text-zinc-400 border-zinc-600";
}

const TABLES = [
  { key: "vector_memory", label: "Memories", icon: Brain },
  { key: "vector_notes",  label: "Notes",    icon: FileText },
  { key: "vector_summaries", label: "Summaries", icon: Tag },
  { key: "vector_code_chunks", label: "Code", icon: Cpu },
];

const SOURCE_TYPES = [
  "preference", "chat_input", "fact", "goal", "idea", "note", "study", "person", "event", "media", "reference"
];

export default function MemoryPage() {
  const [table, setTable] = useState("vector_memory");
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<(MemoryEntry & { score?: number })[] | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<"browse" | "search" | "store">("browse");
  const [storeText, setStoreText] = useState("");
  const [storeType, setStoreType] = useState("note");
  const [storePath, setStorePath] = useState("");
  const [storeTable, setStoreTable] = useState("vector_memory");
  const [storing, setStoring] = useState(false);

  async function load(tbl: string) {
    setLoading(true);
    setSearchResults(null);
    setSearchQ("");
    setActiveType(null);
    try {
      const r = await memory.browse(tbl, 200);
      setEntries(r as MemoryEntry[]);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(table); }, [table]);

  async function doSearch() {
    if (!searchQ.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const r = await memory.search(searchQ, table, 20);
      setSearchResults(r as (MemoryEntry & { score?: number })[]);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  async function doStore() {
    if (!storeText.trim()) return;
    setStoring(true);
    try {
      await memory.store(storeText, storeType, storeTable);
      setStoreText("");
      setStorePath("");
      alert("Stored successfully!");
      load(table);
    } catch (err: unknown) {
      alert("Failed to store: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setStoring(false);
    }
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.source_type] = (counts[e.source_type] ?? 0) + 1;
    return counts;
  }, [entries]);

  const displayed = searchResults ?? (
    activeType ? entries.filter((e) => e.source_type === activeType) : entries
  );

  return (
    <Shell>
      <div className="px-4 pt-6 pb-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <Brain size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Memory</h1>
              <p className="text-xs text-zinc-500">{entries.length} entries · {Object.keys(typeCounts).length} types</p>
            </div>
          </div>
          <button onClick={() => load(table)} className="text-zinc-600 hover:text-violet-400 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          {[
            { key: "browse", label: "Browse", icon: Search },
            { key: "search", label: "Search", icon: Search },
            { key: "store", label: "Store", icon: Plus },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key as "browse" | "search" | "store")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                mode === key
                  ? "bg-violet-600/20 text-violet-300 border-violet-700"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Table tabs - hide in store mode */}
        {mode !== "store" && (
          <div className="flex gap-2">
            {TABLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTable(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  table === key
                    ? "bg-violet-600/20 text-violet-300 border-violet-700"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Store Mode Form */}
        {mode === "store" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                Text to store
              </label>
              <textarea
                value={storeText}
                onChange={(e) => setStoreText(e.target.value)}
                placeholder="Enter text to embed and store in memory..."
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                  Table
                </label>
                <select
                  value={storeTable}
                  onChange={(e) => setStoreTable(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                >
                  {TABLES.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                  Type
                </label>
                <select
                  value={storeType}
                  onChange={(e) => setStoreType(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                >
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                Source path (optional)
              </label>
              <input
                type="text"
                value={storePath}
                onChange={(e) => setStorePath(e.target.value)}
                placeholder="e.g., /notes/personal/project.md"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              onClick={doStore}
              disabled={storing || !storeText.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {storing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Store in memory
            </button>
          </div>
        )}

        {/* Search - hide in store mode */}
        {mode === "search" && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 focus-within:border-violet-600 rounded-xl px-3 py-2.5 transition-colors">
              <Search size={15} className="text-zinc-600 shrink-0" />
              <input
                value={searchQ}
                onChange={(e) => { setSearchQ(e.target.value); if (!e.target.value) setSearchResults(null); }}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Semantic search memories…"
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
              {searchQ && (
                <button onClick={() => { setSearchQ(""); setSearchResults(null); }} className="text-zinc-600 hover:text-zinc-400">
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={doSearch}
              disabled={searching || !searchQ.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </div>
        )}

        {/* Type filter chips - hide in store mode */}
        {!searchResults && mode !== "store" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveType(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                activeType === null ? "bg-zinc-200 text-zinc-900 border-zinc-200" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              All ({entries.length})
            </button>
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  activeType === type ? typeColor(type) : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {type} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Search result label */}
        {searchResults && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{searchResults.length} results for "{searchQ}"</p>
            <button onClick={() => { setSearchResults(null); setSearchQ(""); }} className="text-xs text-zinc-600 hover:text-violet-400 flex items-center gap-1">
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {/* Entries - hide in store mode */}
        {mode !== "store" && (
          loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-zinc-600" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Brain size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No entries found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((entry) => {
                const isExpanded = expanded === entry.id;
                const score = (entry as MemoryEntry & { score?: number }).score;
                const preview = entry.text.length > 120 ? entry.text.slice(0, 120) + "…" : entry.text;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeColor(entry.source_type)}`}>
                            {entry.source_type}
                          </span>
                          {score !== undefined && (
                            <span className="text-[10px] text-zinc-600 font-mono">
                              {(score * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {isExpanded ? entry.text : preview}
                        </p>
                        {entry.source_path && (
                          <p className="text-[10px] text-zinc-600 font-mono truncate">{entry.source_path}</p>
                        )}
                      </div>
                      <span className="text-zinc-700 shrink-0 mt-1">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </Shell>
  );
}
