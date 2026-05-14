"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  console.log("[LoginPage] Component rendering");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setToken } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[LoginPage] Submitting login for username:", username);
    setLoading(true);
    setError("");
    try {
      console.log("[LoginPage] Calling auth.login...");
      const res = await auth.login(username, password);
      console.log("[LoginPage] Login successful, token:", res.access_token ? "received" : "missing");
      setToken(res.access_token, username);
      console.log("[LoginPage] Token set, redirecting to /");
      router.replace("/");
    } catch (err: unknown) {
      console.error("[LoginPage] Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-violet-400 tracking-tight">Heimdall</h1>
          <p className="text-zinc-500 mt-1 text-sm">Your personal AI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 space-y-4 border border-zinc-800">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100 placeholder-zinc-600"
              placeholder="nicholas"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
