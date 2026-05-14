"use client";
import { useState, useRef } from "react";
import Shell from "@/components/Shell";
import { ingest } from "@/lib/api";
import { Upload, Link2, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

type Mode = "file" | "url" | "text";
type Result = { status: string; title?: string; vault_folder?: string; vault_file?: string; chunks_stored?: number; summary?: string; tags?: string[]; question?: string; session_id?: string };

export default function IngestPage() {
  const [mode, setMode] = useState<Mode>("file");
  const [hint, setHint] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let res: Result;
      if (mode === "file" && file) res = await ingest.file(file, hint);
      else if (mode === "url") res = await ingest.url(url, hint);
      else res = await ingest.text(text, hint);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitClarify() {
    if (!result?.session_id) return;
    setLoading(true);
    setError("");
    try {
      const res = await ingest.clarify(result.session_id, clarifyAnswer);
      setResult(res);
      setClarifyAnswer("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Clarification failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setFile(null);
    setUrl("");
    setText("");
    setHint("");
    setClarifyAnswer("");
  }

  return (
    <Shell>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <h1 className="text-xl font-bold text-zinc-100">Ingest</h1>

        {/* Mode tabs */}
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {(["file", "url", "text"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors capitalize ${
                mode === m ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Inputs */}
        {mode === "file" && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept=".txt,.md,.pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-xl p-8 flex flex-col items-center gap-2 transition-colors"
            >
              <Upload size={28} className="text-zinc-600" />
              <p className="text-sm text-zinc-500">{file ? file.name : "Tap to choose file"}</p>
              <p className="text-xs text-zinc-700">PDF, DOCX, TXT, MD, PPTX, images</p>
            </button>
          </div>
        )}

        {mode === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or Instagram URL"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100 placeholder-zinc-600"
          />
        )}

        {mode === "text" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste any text, notes, or content to index…"
            rows={6}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100 placeholder-zinc-600 resize-none"
          />
        )}

        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Optional hint — what is this about?"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100 placeholder-zinc-600"
        />

        <button
          onClick={submit}
          disabled={loading || (mode === "file" && !file) || (mode === "url" && !url) || (mode === "text" && !text)}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : "Ingest"}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Clarification needed */}
        {result?.status === "needs_clarification" && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-amber-300 font-medium">Clarification needed</p>
            <p className="text-sm text-amber-200">{result.question}</p>
            <textarea
              value={clarifyAnswer}
              onChange={(e) => setClarifyAnswer(e.target.value)}
              placeholder="Your answer…"
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-100 resize-none"
            />
            <button
              onClick={submitClarify}
              disabled={loading || !clarifyAnswer.trim()}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : "Submit answer"}
            </button>
          </div>
        )}

        {/* Success */}
        {result?.status === "indexed" && (
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <p className="text-sm text-emerald-300 font-medium">Indexed successfully</p>
              </div>
              <button onClick={reset} className="text-zinc-600 hover:text-zinc-400"><X size={16} /></button>
            </div>
            {result.title && <p className="text-sm text-zinc-300 font-medium">{result.title}</p>}
            {result.summary && <p className="text-sm text-zinc-400">{result.summary}</p>}
            <div className="flex flex-wrap gap-2">
              {result.vault_folder && (
                <span className="text-xs bg-violet-900/40 text-violet-300 px-2 py-0.5 rounded-full border border-violet-800">
                  📁 {result.vault_folder}
                </span>
              )}
              {result.chunks_stored !== undefined && (
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  {result.chunks_stored} chunks
                </span>
              )}
              {result.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
