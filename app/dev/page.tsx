"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import dynamic from "next/dynamic";
import {
  ChevronRight, ChevronDown, FileCode2, FolderOpen, Folder,
  Sparkles, Check, X, RotateCcw, Loader2, AlertTriangle,
  GitBranch, Terminal, Code2, SplitSquareHorizontal, Save,
  RefreshCw, ChevronLeft, Send
} from "lucide-react";
import { diffLines } from "diff";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
const DiffViewer = dynamic(() => import("@/components/DiffViewer"), { ssr: false });

const BASE = "/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("heimdall_token") : null; }

async function devReq<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail); }
  return res.json();
}

// ── File tree types ──────────────────────────────────────────────────────────
interface TreeNode { name: string; path: string; children?: TreeNode[]; isDir: boolean; }

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      let node = current.find((n) => n.name === name);
      if (!node) {
        node = { name, path: parts.slice(0, i + 1).join("/"), isDir: !isLast, children: isLast ? undefined : [] };
        current.push(node);
      }
      if (!isLast) current = node.children!;
    }
  }
  // Sort: dirs first, then files
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    nodes.forEach((n) => n.children && sort(n.children));
    return nodes;
  };
  return sort(root);
}

// ── File Tree ────────────────────────────────────────────────────────────────
function TreeItem({
  node, depth, activeFile, onSelect, expandedDirs, toggleDir,
}: {
  node: TreeNode; depth: number; activeFile: string | null;
  onSelect: (path: string) => void;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isActive = activeFile === node.path;

  if (node.isDir) {
    return (
      <>
        <button
          onClick={() => toggleDir(node.path)}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          className="w-full flex items-center gap-1.5 py-0.5 pr-2 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-300 text-[12px] transition-colors"
        >
          {isExpanded ? <ChevronDown size={11} className="shrink-0 text-zinc-600" /> : <ChevronRight size={11} className="shrink-0 text-zinc-600" />}
          {isExpanded ? <FolderOpen size={13} className="shrink-0 text-amber-400/70" /> : <Folder size={13} className="shrink-0 text-amber-400/70" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children?.map((child) => (
          <TreeItem key={child.path} node={child} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} expandedDirs={expandedDirs} toggleDir={toggleDir} />
        ))}
      </>
    );
  }

  const ext = node.name.split(".").pop() ?? "";
  const iconColor =
    ext === "tsx" || ext === "ts" ? "text-blue-400" :
    ext === "css" ? "text-pink-400" :
    ext === "json" ? "text-yellow-400" :
    ext === "md" ? "text-green-400" : "text-zinc-500";

  return (
    <button
      onClick={() => onSelect(node.path)}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={`w-full flex items-center gap-1.5 py-0.5 pr-2 text-[12px] transition-colors truncate ${
        isActive ? "bg-violet-600/20 text-violet-300 border-r-2 border-violet-500" : "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-300"
      }`}
    >
      <span className="w-2.5 shrink-0" />
      <FileCode2 size={12} className={`shrink-0 ${iconColor}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// ── Main IDE ─────────────────────────────────────────────────────────────────
type PanelMode = "editor" | "diff";

interface FileChange { path: string; content: string; }
interface GenerateResult { explanation: string; files: FileChange[]; originals: Record<string, string>; }
interface ApplyResult { status: string; written: string[]; explanation: string; build_output?: string; detail?: string; }

export default function DevPage() {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["app", "components", "lib"]));
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [fileLoading, setFileLoading] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("editor");
  const [showAI, setShowAI] = useState(true);

  // AI state
  const [prompt, setPrompt] = useState("");
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [activeDiffFile, setActiveDiffFile] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState("");

  // Terminal output
  const [termOutput, setTermOutput] = useState<string[]>([]);
  const [showTerm, setShowTerm] = useState(false);

  // Sidebar collapsed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    devReq<{ files: string[] }>("/dev/files").then((r) => {
      setAllFiles(r.files);
      setTree(buildTree(r.files));
    }).catch(() => {});
  }, []);

  const openFile = useCallback(async (path: string) => {
    setActiveFile(path);
    if (!openTabs.includes(path)) setOpenTabs((t) => [...t, path]);
    if (fileContents[path] !== undefined) return;
    setFileLoading(true);
    try {
      const r = await devReq<{ content: string }>("/dev/read", { path });
      setFileContents((prev) => ({ ...prev, [path]: r.content }));
    } finally { setFileLoading(false); }
  }, [openTabs, fileContents]);

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path) setActiveFile(newTabs[newTabs.length - 1] ?? null);
  };

  function toggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    setResult(null);
    setApplyResult(null);
    // Auto-add active file as context
    const ctx = [...new Set([...(activeFile ? [activeFile] : []), ...contextFiles])].slice(0, 5);
    try {
      const res = await devReq<GenerateResult>("/dev/generate", { prompt, files: ctx });
      setResult(res);
      if (res.files.length > 0) {
        setActiveDiffFile(res.files[0].path);
        setPanelMode("diff");
      }
      setTermOutput([`[AI] ${res.explanation}`]);
      setShowTerm(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally { setGenerating(false); }
  }

  async function apply() {
    if (!result) return;
    setApplying(true);
    setTermOutput(["[BUILD] Starting npm build…"]);
    setShowTerm(true);
    try {
      const res = await devReq<ApplyResult>("/dev/apply", { files: result.files, explanation: result.explanation });
      setApplyResult(res);
      const lines = (res.build_output ?? "").split("\n").filter(Boolean).slice(-20);
      setTermOutput([
        `[BUILD] ${res.status === "success" ? "✓ Success" : "✗ Failed"}`,
        ...lines,
        ...(res.written ? [`[WRITTEN] ${res.written.join(", ")}`] : []),
      ]);
      if (res.status === "success") {
        // Refresh file contents for written files
        for (const path of res.written ?? []) {
          try {
            const r = await devReq<{ content: string }>("/dev/read", { path });
            setFileContents((prev) => ({ ...prev, [path]: r.content }));
          } catch { /* ignore */ }
        }
        setResult(null);
        setPrompt("");
        setPanelMode("editor");
        // Re-fetch file list
        devReq<{ files: string[] }>("/dev/files").then((r) => { setAllFiles(r.files); setTree(buildTree(r.files)); }).catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally { setApplying(false); }
  }

  const activeDiffChange = result?.files.find((f) => f.path === activeDiffFile);

  const QUICK = [
    "Add a /vault page listing vault files grouped by folder",
    "Add a /profile page with server health and memory stats",
    "Add a keyboard shortcut (Cmd+K) to open the AI prompt",
  ];

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-300 overflow-hidden">

        {/* ── Title Bar ── */}
        <div className="flex items-center h-9 px-3 bg-zinc-900 border-b border-zinc-800 shrink-0 gap-3">
          <button onClick={() => setSidebarOpen((v) => !v)} className="text-zinc-600 hover:text-zinc-400">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
          <Code2 size={14} className="text-violet-400" />
          <span className="text-xs text-zinc-400 font-medium">Heimdall Dev</span>
          <div className="flex-1" />
          <button
            onClick={() => setShowAI((v) => !v)}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors ${showAI ? "bg-violet-600/30 text-violet-300 border border-violet-700" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            <Sparkles size={12} /> AI
          </button>
          <button onClick={() => setShowTerm((v) => !v)} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors ${showTerm ? "bg-zinc-700 text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}>
            <Terminal size={12} /> Terminal
          </button>
          {result && (
            <button onClick={() => { setPanelMode(panelMode === "diff" ? "editor" : "diff"); }} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-amber-600/20 text-amber-300 border border-amber-700 hover:bg-amber-600/30 transition-colors">
              <SplitSquareHorizontal size={12} /> Diff
            </button>
          )}
        </div>

        <div className="flex flex-1 min-h-0">

          {/* ── Sidebar File Tree ── */}
          {sidebarOpen && (
            <div className="w-52 shrink-0 flex flex-col bg-zinc-950 border-r border-zinc-800 overflow-hidden">
              <div className="px-3 py-2 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold border-b border-zinc-800 flex items-center justify-between">
                <span>Explorer</span>
                <button onClick={() => devReq<{ files: string[] }>("/dev/files").then((r) => { setAllFiles(r.files); setTree(buildTree(r.files)); })} className="text-zinc-700 hover:text-zinc-400">
                  <RefreshCw size={10} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {tree.map((node) => (
                  <TreeItem key={node.path} node={node} depth={0} activeFile={activeFile} onSelect={openFile} expandedDirs={expandedDirs} toggleDir={toggleDir} />
                ))}
              </div>
              <div className="px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-700">
                {allFiles.length} files
              </div>
            </div>
          )}

          {/* ── Main Editor Area ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">

            {/* Tabs */}
            <div className="flex items-end bg-zinc-900 border-b border-zinc-800 shrink-0 overflow-x-auto">
              {openTabs.map((tab) => {
                const name = tab.split("/").pop() ?? tab;
                const isDirty = result?.files.some((f) => f.path === tab);
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveFile(tab); if (panelMode === "diff" && result?.files.some(f => f.path === tab)) { setActiveDiffFile(tab); } else { setPanelMode("editor"); } }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[12px] border-r border-zinc-800 shrink-0 transition-colors ${
                      activeFile === tab
                        ? "bg-[#0a0a0a] text-zinc-200 border-t border-t-violet-500"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                    }`}
                  >
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                    <span>{name}</span>
                    <span
                      onClick={(e) => closeTab(tab, e)}
                      className="text-zinc-600 hover:text-zinc-300 ml-0.5"
                    >
                      <X size={10} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Editor / Diff */}
            <div className="flex-1 min-h-0 relative">
              {activeFile ? (
                panelMode === "diff" && activeDiffChange ? (
                  <DiffViewer
                    path={activeDiffChange.path}
                    original={result?.originals[activeDiffChange.path] ?? ""}
                    updated={activeDiffChange.content}
                  />
                ) : fileLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin text-zinc-600" />
                  </div>
                ) : (
                  <CodeEditor
                    key={activeFile}
                    path={activeFile}
                    value={fileContents[activeFile] ?? ""}
                    onChange={(v) => setFileContents((prev) => ({ ...prev, [activeFile]: v }))}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3">
                  <Code2 size={40} strokeWidth={1} />
                  <p className="text-sm">Select a file from the explorer</p>
                  <p className="text-xs text-zinc-800">or use AI to generate changes</p>
                </div>
              )}

              {/* Diff file tabs when in diff mode */}
              {panelMode === "diff" && result && result.files.length > 1 && (
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  {result.files.map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setActiveDiffFile(f.path)}
                      className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                        activeDiffFile === f.path ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {f.path.split("/").pop()}
                      {result.originals[f.path] === "" && <span className="ml-1 text-emerald-400">+</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Terminal Panel ── */}
            {showTerm && (
              <div className="h-40 shrink-0 border-t border-zinc-800 bg-zinc-950 flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <Terminal size={11} />
                    <span>OUTPUT</span>
                  </div>
                  <button onClick={() => setShowTerm(false)} className="text-zinc-700 hover:text-zinc-400"><X size={11} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] space-y-0.5">
                  {termOutput.length === 0 ? (
                    <span className="text-zinc-700">No output yet</span>
                  ) : termOutput.map((line, i) => (
                    <div key={i} className={
                      line.startsWith("[AI]") ? "text-violet-400" :
                      line.startsWith("[BUILD] ✓") ? "text-emerald-400" :
                      line.startsWith("[BUILD] ✗") ? "text-red-400" :
                      line.startsWith("[WRITTEN]") ? "text-amber-400" :
                      line.includes("error") || line.includes("Error") ? "text-red-400" :
                      "text-zinc-500"
                    }>{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── AI Panel ── */}
          {showAI && (
            <div className="w-72 shrink-0 flex flex-col bg-zinc-950 border-l border-zinc-800">
              <div className="px-3 py-2 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold border-b border-zinc-800 flex items-center gap-2">
                <Sparkles size={11} className="text-violet-400" />
                <span>AI Assistant</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">

                {/* Error */}
                {error && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex gap-2">
                    <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300">{error}</p>
                  </div>
                )}

                {/* Apply result */}
                {applyResult && (
                  <div className={`border rounded-lg p-3 space-y-2 ${applyResult.status === "success" ? "bg-emerald-900/20 border-emerald-800" : "bg-amber-900/20 border-amber-800"}`}>
                    <div className="flex items-center gap-2">
                      {applyResult.status === "success" ? <Check size={13} className="text-emerald-400" /> : <AlertTriangle size={13} className="text-amber-400" />}
                      <span className={`text-[11px] font-medium ${applyResult.status === "success" ? "text-emerald-300" : "text-amber-300"}`}>
                        {applyResult.status === "success" ? "Applied & rebuilt" : "Build failed"}
                      </span>
                      <button onClick={() => setApplyResult(null)} className="ml-auto text-zinc-700 hover:text-zinc-400"><X size={11} /></button>
                    </div>
                    {applyResult.written?.map((f) => (
                      <div key={f} className="text-[10px] font-mono text-zinc-500">{f}</div>
                    ))}
                  </div>
                )}

                {/* Diff actions */}
                {result && (
                  <div className="space-y-2">
                    <div className="bg-violet-900/20 border border-violet-800 rounded-lg p-3">
                      <p className="text-[11px] text-violet-200 leading-relaxed">{result.explanation}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600">{result.files.length} file(s) changed</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setResult(null); setPanelMode("editor"); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors">
                        <RotateCcw size={11} /> Discard
                      </button>
                      <button onClick={apply} disabled={applying} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors">
                        {applying ? <><Loader2 size={11} className="animate-spin" /> Building</> : <><Check size={11} /> Apply</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Context */}
                {!result && (
                  <>
                    <div>
                      <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wide">Context</p>
                      {activeFile && (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <FileCode2 size={11} className="text-violet-400 shrink-0" />
                          <span className="text-[11px] text-zinc-400 font-mono truncate">{activeFile.split("/").pop()}</span>
                          <span className="text-[9px] text-zinc-700 ml-auto">active</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wide">Suggestions</p>
                      <div className="space-y-1.5">
                        {QUICK.map((q) => (
                          <button key={q} onClick={() => setPrompt(q)} className="w-full text-left text-[11px] text-zinc-500 hover:text-violet-400 bg-zinc-900 border border-zinc-800 hover:border-violet-700/50 rounded-lg px-2.5 py-2 transition-colors leading-relaxed">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Prompt input */}
              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                    placeholder="Describe a change…"
                    rows={3}
                    className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-600 rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-600 transition-colors"
                  />
                  <button
                    onClick={generate}
                    disabled={generating || !prompt.trim()}
                    className="w-8 h-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors shrink-0"
                  >
                    {generating ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-700 mt-1.5">Enter to generate · Shift+Enter for newline</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
