"use client";
import { useState, useRef, useEffect } from "react";
import Shell from "@/components/Shell";
import { chat, models, brief } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { Send, Trash2, Loader2, Bot, User, Cpu, Brain, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const { messages, addMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; provider: string; available: boolean }>>([]);
  const [storeInMemory, setStoreInMemory] = useState(true);
  const [contextUsed, setContextUsed] = useState<Array<{ text: string; source: string }>>([]);
  const [showBrief, setShowBrief] = useState(false);
  const [briefText, setBriefText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    models.list().then((data) => setAvailableModels(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      const defaultModel = availableModels.find(m => m.available) || availableModels[0];
      setSelectedModel(defaultModel.id);
    }
  }, [availableModels, selectedModel]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setContextUsed([]);
    addMessage({ role: "user", content: text, timestamp: Date.now() });
    setLoading(true);
    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await chat.send(text, history, selectedModel, storeInMemory);
      addMessage({ role: "assistant", content: res.reply, model: res.model, timestamp: Date.now() });
      if (res.context_used) {
        setContextUsed(res.context_used);
      }
    } catch (err: unknown) {
      addMessage({ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  }

  async function fetchBrief() {
    setShowBrief(true);
    try {
      const res = await brief.get("morning");
      setBriefText(res.brief);
    } catch (err: unknown) {
      setBriefText(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <Shell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-zinc-200">Heimdall</h1>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.available}>
                  {m.name} {m.available ? "" : "(unavailable)"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBrief}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            >
              <Sparkles size={14} />
              Brief
            </button>
            <button onClick={clearMessages} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Brief Modal */}
        {showBrief && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-200">Morning Brief</h2>
                <button onClick={() => setShowBrief(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={20} />
                </button>
              </div>
              <div className="brief-md text-sm text-zinc-300">
                <ReactMarkdown>{briefText}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Context Pills */}
        {contextUsed.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Brain size={12} className="text-violet-400" />
              <span>Context retrieved:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {contextUsed.slice(0, 3).map((ctx, i) => (
                  <span key={i} className="px-2 py-0.5 bg-violet-900/30 border border-violet-700/50 rounded text-violet-300 truncate max-w-[200px]">
                    {ctx.text.slice(0, 40)}...
                  </span>
                ))}
                {contextUsed.length > 3 && (
                  <span className="text-zinc-500">+{contextUsed.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-600 text-sm mt-12">
              <Bot size={40} className="mx-auto mb-3 text-zinc-700" />
              <p>Ask me anything.</p>
              <p className="mt-1 text-zinc-700 text-xs">I remember everything you&apos;ve told me.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-violet-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="brief-md">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                {msg.model && (
                  <p className="text-[10px] text-zinc-500 mt-1">{msg.model}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-zinc-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-violet-400" />
              </div>
              <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 size={16} className="animate-spin text-violet-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-400">
                <input
                  type="checkbox"
                  checked={storeInMemory}
                  onChange={(e) => setStoreInMemory(e.target.checked)}
                  className="rounded border-zinc-600 text-violet-600 focus:ring-violet-500"
                />
                <span>Save to memory</span>
              </label>
              <span className="ml-auto">{input.length} chars</span>
            </div>
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message Heimdall…"
                rows={1}
                className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-100 placeholder-zinc-600 max-h-32"
                style={{ overflowY: "auto" }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
