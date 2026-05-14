"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { health, models } from "@/lib/api";
import { Activity, Cpu, RefreshCw, CheckCircle, XCircle, Clock, Zap, DollarSign } from "lucide-react";

interface HealthStatus {
  status: string;
  version?: string;
  postgres?: { status: string; message?: string };
  ollama?: { status: string; message?: string };
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
  speed?: string;
  cost?: string;
}

export default function SystemPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [modelList, setModelList] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [healthData, modelsData] = await Promise.all([
        health.check(),
        models.list(),
      ]);
      setHealthStatus(healthData);
      setModelList(modelsData);
    } catch (err: unknown) {
      console.error("Failed to load system data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Shell>
      <div className="px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">System</h1>
              <p className="text-xs text-zinc-500">Health & Model Status</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="text-zinc-600 hover:text-violet-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && !healthStatus ? (
          <div className="flex justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            {/* Health Status */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overall Status */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Overall</span>
                    {healthStatus?.status === "healthy" ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                  <p className="text-lg font-semibold text-zinc-100 capitalize">
                    {healthStatus?.status || "Unknown"}
                  </p>
                  {healthStatus?.version && (
                    <p className="text-xs text-zinc-500 mt-1">v{healthStatus.version}</p>
                  )}
                </div>

                {/* PostgreSQL */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">PostgreSQL</span>
                    {healthStatus?.postgres?.status === "healthy" ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                  <p className="text-lg font-semibold text-zinc-100 capitalize">
                    {healthStatus?.postgres?.status || "Unknown"}
                  </p>
                  {healthStatus?.postgres?.message && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{healthStatus.postgres.message}</p>
                  )}
                </div>

                {/* Ollama */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Ollama LLM</span>
                    {healthStatus?.ollama?.status === "healthy" ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                  <p className="text-lg font-semibold text-zinc-100 capitalize">
                    {healthStatus?.ollama?.status || "Unknown"}
                  </p>
                  {healthStatus?.ollama?.message && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{healthStatus.ollama.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Models */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Models</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {modelList.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <Cpu size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No models available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {modelList.map((model) => (
                      <div
                        key={model.id}
                        className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-zinc-200 truncate">{model.name}</p>
                            {!model.available && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-900/30 border border-red-700/50 rounded text-red-400">
                                unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">{model.provider}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          {model.speed && (
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <Zap size={12} />
                              {model.speed}
                            </div>
                          )}
                          {model.cost && (
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <DollarSign size={12} />
                              {model.cost}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
