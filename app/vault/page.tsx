"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { vault } from "@/lib/api";
import { BookOpen, RefreshCw, ExternalLink, Folder, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

interface VaultStatus {
  path: string;
  note_count: number;
  last_sync?: string;
  status: string;
}

export default function VaultPage() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const data = await vault.status();
      setStatus(data);
    } catch (err: unknown) {
      console.error("Failed to load vault status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await vault.syncNow();
      await loadStatus();
    } catch (err: unknown) {
      console.error("Failed to sync vault:", err);
      alert("Sync failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <Shell>
      <div className="px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Vault</h1>
              <p className="text-xs text-zinc-500">Obsidian-compatible knowledge base</p>
            </div>
          </div>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="text-zinc-600 hover:text-violet-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Access Instructions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Access via Obsidian</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your vault is located at <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">/opt/heimdall/vault/</code>.
            Open Obsidian and select this folder as your vault to access all your notes.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <FileText size={12} />
            <span>All notes are automatically synced from AI interactions</span>
          </div>
        </div>

        {/* Vault Status */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-zinc-600" />
          </div>
        ) : status ? (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">Status</span>
                <div className="flex items-center gap-1.5">
                  {status.status === "ok" ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <span className="text-xs font-medium capitalize text-zinc-200">{status.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Notes</p>
                  <p className="text-lg font-semibold text-zinc-100">{status.note_count}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Path</p>
                  <p className="text-xs text-zinc-300 truncate">{status.path}</p>
                </div>
              </div>
              {status.last_sync && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">Last sync</p>
                  <p className="text-xs text-zinc-300">{new Date(status.last_sync).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Sync Button */}
            <button
              onClick={syncNow}
              disabled={syncing}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sync Now
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Unable to load vault status</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <ExternalLink size={14} className="text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              The vault serves as your external knowledge base. All AI-generated content is written here as Obsidian-compatible markdown files,
              making them accessible for manual editing and organization.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
