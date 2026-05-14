"use client";
import Shell from "@/components/Shell";
import { Map } from "lucide-react";

interface RoadmapItem {
  done: boolean;
  text: string;
}

interface RoadmapPhase {
  phase: string;
  status: "done" | "wip" | "todo";
  items: RoadmapItem[];
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Phase 1A — Foundation",
    status: "done",
    items: [
      { done: true, text: "Ubuntu 26.04 LTS installed, SSH working" },
      { done: true, text: "Docker Compose — Postgres, Ollama, Redis, Langfuse" },
      { done: true, text: "pgvector extension enabled, 4 vector tables created" },
      { done: true, text: "nomic-embed-text embeddings via Ollama" },
      { done: true, text: "atlas/db/vector_store.py — store, search, search_all" },
      { done: true, text: "VECTOR-SEARCH.md documentation written" },
    ],
  },
  {
    phase: "Phase 1B — Core Services",
    status: "done",
    items: [
      { done: true, text: "PostgreSQL + pgvector running" },
      { done: true, text: "Ollama running with qwen3:1.7b, qwen3:8b, nomic-embed-text" },
      { done: true, text: "Redis running" },
      { done: true, text: "Langfuse deployed (restarting — non-blocking)" },
    ],
  },
  {
    phase: "Phase 1C — Heimdall API",
    status: "done",
    items: [
      { done: true, text: "FastAPI app — main.py with CORS, startup hooks" },
      { done: true, text: "POST /chat — memory context injection, multi-provider routing" },
      { done: true, text: "POST /chat/stream — SSE streaming endpoint" },
      { done: true, text: "GET /memory/search, POST /memory/store" },
      { done: true, text: "GET /health — Postgres + Ollama status" },
      { done: true, text: "GET /models — local + cloud model list" },
      { done: true, text: "DeepSeek V3 Flash/Pro integration" },
      { done: true, text: "Groq Llama 4 Scout, Llama 3 70B/8B integration" },
      { done: true, text: "Tailscale — remote access at 100.113.79.103" },
      { done: true, text: "Dashboard — chat, memory, system, roadmap panels" },
      { done: true, text: "Streaming token rendering with marked.js MD" },
    ],
  },
  {
    phase: "Phase 2A — Agent Core",
    status: "todo",
    items: [
      { done: false, text: "atlas/core/embeddings.py — reusable embedding wrapper" },
      { done: false, text: "Capability planner — routes requests to correct sub-agents/models" },
      { done: false, text: "Task queue — async task dispatch with status tracking" },
      { done: false, text: "Memory consolidation — auto-summarise old chat to vector_chat_summaries" },
    ],
  },
  {
    phase: "Phase 2B — Tools & Integrations",
    status: "todo",
    items: [
      { done: false, text: "Paperless-ngx — document OCR container" },
      { done: false, text: "VSCode connector — file ops, terminal, Git via API" },
      { done: false, text: "Google Calendar / Maps tool integration" },
      { done: false, text: "Garmin / Apple Health data ingestion" },
      { done: false, text: "Obsidian Vault sync" },
      { done: false, text: "n8n workflow automation" },
    ],
  },
  {
    phase: "Phase 3 — Voice & GPU",
    status: "todo",
    items: [
      { done: false, text: "Wake word detection (Porcupine / openWakeWord)" },
      { done: false, text: "Whisper STT integration" },
      { done: false, text: "TTS pipeline (Coqui / Piper)" },
      { done: false, text: "GPU install (RTX 3090 planned) — ~80 tok/s local inference" },
      { done: false, text: "Next.js dashboard rebuild with SSR" },
    ],
  },
];

function statusBadge(status: string) {
  if (status === "done") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700 font-medium">
        COMPLETE
      </span>
    );
  }
  if (status === "wip") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700 font-medium">
        IN PROGRESS
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
      PLANNED
    </span>
  );
}

export default function RoadmapPage() {
  return (
    <Shell>
      <div className="px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <Map size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Roadmap</h1>
            <p className="text-xs text-zinc-500">Project milestones and progress</p>
          </div>
        </div>

        {/* Roadmap Phases */}
        <div className="space-y-4">
          {ROADMAP.map((phase, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Phase Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-200">{phase.phase}</h3>
                {statusBadge(phase.status)}
              </div>

              {/* Phase Items */}
              <div className="divide-y divide-zinc-800">
                {phase.items.map((item, j) => (
                  <div
                    key={j}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      item.done ? "bg-zinc-800/30" : "hover:bg-zinc-800/50"
                    } transition-colors`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        item.done
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-zinc-600 text-transparent"
                      }`}
                    >
                      {item.done && <span className="text-xs">✓</span>}
                    </div>
                    <p className={`text-sm ${item.done ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
