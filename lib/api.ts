const BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("heimdall_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  console.log(`[API] Request: ${BASE}${path}`, options.method || "GET");
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
  }

  console.log(`[API] Fetching ${BASE}${path} with headers:`, headers);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  console.log(`[API] Response status: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    console.error(`[API] Error response:`, err);
    throw new Error(err.detail ?? "Request failed");
  }
  const data = await res.json();
  console.log(`[API] Success response:`, data);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams({ username, password });
    return request<{ access_token: string; expires_in_minutes: number }>(
      "/auth/login",
      { method: "POST", body: form }
    );
  },
  me: () => request<{ username: string; is_admin: boolean }>("/auth/me"),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chat = {
  send: (message: string, history: { role: string; content: string }[] = [], model?: string, store_in_memory?: boolean) =>
    request<{ reply: string; model: string; stored: boolean; plan?: {}; context_used?: Array<{ text: string; source: string }> }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, model, store_in_memory }),
    }),
  streamUrl: () => `${BASE}/chat/stream`,
};

// ── Brief ─────────────────────────────────────────────────────────────────────
export const brief = {
  get: (type: "auto" | "morning" | "evening" = "auto") =>
    request<{ brief: string; brief_type: "morning" | "evening"; date: string }>(`/brief?type=${type}`),
};

// ── Memory ────────────────────────────────────────────────────────────────────
export const memory = {
  search: (q: string, table = "vector_memory", limit = 8) =>
    request<{ id: string; text: string; score: number; source_type: string; source_path?: string }[]>(
      `/memory/search?q=${encodeURIComponent(q)}&table=${table}&limit=${limit}`
    ),
  browse: (table = "vector_memory", limit = 200) =>
    request<{ id: string; text: string; source_type: string; source_path?: string; created_at?: string }[]>(
      `/memory/browse?table=${table}&limit=${limit}`
    ),
  store: (text: string, source_type = "note", table = "vector_memory") =>
    request<{ id: string }>("/memory/store", {
      method: "POST",
      body: JSON.stringify({ text, source_type, table }),
    }),
};

// ── Ingest ────────────────────────────────────────────────────────────────────
export const ingest = {
  file: (file: File, hint?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (hint) form.append("hint", hint);
    return request<{ status: string; session_id?: string; needs_clarification?: boolean; question?: string; message?: string }>(
      "/ingest/file", { method: "POST", body: form }
    );
  },
  url: (url: string, hint?: string) =>
    request<{ status: string; session_id?: string; needs_clarification?: boolean; question?: string; message?: string }>(
      "/ingest/url", { method: "POST", body: JSON.stringify({ url, hint }) }
    ),
  text: (text: string, hint?: string) =>
    request<{ status: string; session_id?: string; needs_clarification?: boolean; question?: string; message?: string }>(
      "/ingest/text", { method: "POST", body: JSON.stringify({ text, hint }) }
    ),
  clarify: (session_id: string, answer: string) =>
    request<{ status: string; message?: string }>(
      "/ingest/clarify", { method: "POST", body: JSON.stringify({ session_id, answer }) }
    ),
};

// ── Vault ─────────────────────────────────────────────────────────────────────
export const vault = {
  sync: () => request<{ status: string }>("/vault/sync", { method: "POST" }),
  syncNow: () => request<{ status: string }>("/vault/sync/now", { method: "POST" }),
  status: () => request<{ path: string; note_count: number; last_sync?: string; status: string }>("/vault/status"),
};

// ── Goals & Todos ─────────────────────────────────────────────────────────────
export interface TodoResponse {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  due_date?: string;
  plan_id?: string;
}

export interface GoalResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  target_date?: string;
}

export const todos = {
  today: () => request<TodoResponse[]>("/goals/todos/today"),
  list: (params: { status?: string; plan_id?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.plan_id) q.set("plan_id", params.plan_id);
    return request<TodoResponse[]>(`/goals/todos/list?${q}`);
  },
  complete: (id: string) =>
    request<TodoResponse>(`/goals/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    }),
};

export const goals = {
  list: (params: { status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    return request<GoalResponse[]>(`/goals/list?${q}`);
  },
};

// ── Habits ────────────────────────────────────────────────────────────────────
export interface HabitWithProgress {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  target_count: number;
  completed_today: boolean;
  streak: number;
  completion_rate: number;
}

export const habits = {
  today: () => request<HabitWithProgress[]>("/habits/today"),
  list: () => request<HabitWithProgress[]>("/habits/list"),
  log: (id: string) =>
    request<{ status: string }>(`/habits/${id}/log`, { method: "POST", body: JSON.stringify({}) }),
};

// ── Budget ────────────────────────────────────────────────────────────────────
export interface BudgetSummary {
  month: string;
  total_income: number;
  total_expenses: number;
  net: number;
  categories: { name: string; spent: number; limit: number }[];
  recent_transactions: { id: string; description: string; amount: number; type: string; date: string; category?: string }[];
}

export const budget = {
  summary: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (month) q.set("month", String(month));
    return request<BudgetSummary>(`/budget/summary/monthly?${q}`);
  },
  transactions: (params: { limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    return request<TransactionResponse[]>(`/budget/transactions?${q}`);
  },
};

// ── Health ────────────────────────────────────────────────────────────────────
export const health = {
  check: () => request<{ status: string; version?: string }>("/health"),
};

// ── Models ────────────────────────────────────────────────────────────────────
export const models = {
  list: () => request<Array<{ id: string; name: string; provider: string; available: boolean; speed?: string; cost?: string }>>("/models"),
};

// ── Knowledge Graph ───────────────────────────────────────────────────────────
export interface GraphNode { id: string; label: string; vault: string; node_type: string; connection_count: number; }
export interface GraphEdge { source: string; target: string; type: string; is_backlink: boolean; }
export interface VaultInfo { id: string; name: string; note_count: number; color: string; latest_note?: string; }
export interface RelatedNote { path: string; title: string; vault: string; link_type: string; is_backlink: boolean; }

export const graph = {
  nodes: (params: { vault?: string; query?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.vault) q.set("vault", params.vault);
    if (params.query) q.set("query", params.query);
    if (params.limit) q.set("limit", String(params.limit));
    return request<GraphNode[]>(`/graph/nodes?${q}`);
  },
  edges: (params: { vault?: string; limit?: number; include_backlinks?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.vault) q.set("vault", params.vault);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.include_backlinks !== undefined) q.set("include_backlinks", String(params.include_backlinks));
    return request<GraphEdge[]>(`/graph/edges?${q}`);
  },
  stats: () => request<{ total_notes: number; total_links: number; vault_breakdown: Record<string, number>; top_connected: { path: string; title: string; vault: string; connections: number }[]; isolated_nodes: number }>("/graph/stats"),
  vaults: () => request<VaultInfo[]>("/graph/vaults"),
  reindex: () => request<{ status: string; vaults_scanned: number; total_links_created: number }>("/graph/reindex", { method: "POST", body: JSON.stringify({}) }),
  related: (path: string, limit = 10) => request<RelatedNote[]>(`/graph/related/${encodeURIComponent(path)}?limit=${limit}`),
};