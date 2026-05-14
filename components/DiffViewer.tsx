"use client";
import { diffLines } from "diff";

interface Props {
  original: string;
  updated: string;
  path: string;
}

export default function DiffViewer({ original, updated, path }: Props) {
  const isNew = original === "";
  const changes = isNew
    ? [{ value: updated, added: true, removed: false, count: updated.split("\n").length }]
    : diffLines(original, updated);

  const stats = changes.reduce(
    (acc, c) => { if (c.added) acc.added += c.count ?? 1; if (c.removed) acc.removed += c.count ?? 1; return acc; },
    { added: 0, removed: 0 }
  );

  let lineNum = { left: 0, right: 0 };

  return (
    <div className="h-full flex flex-col font-mono text-[11px] bg-[#0a0a0a]">
      {/* Diff header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <span className="text-zinc-300">{path}</span>
        <div className="flex gap-3">
          {stats.removed > 0 && <span className="text-red-400">-{stats.removed}</span>}
          {stats.added > 0 && <span className="text-emerald-400">+{stats.added}</span>}
          {isNew && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded">NEW FILE</span>}
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Left — original */}
          <div className="flex-1 min-w-0 border-r border-zinc-800">
            {!isNew && <div className="px-3 py-1.5 text-[10px] text-zinc-600 bg-zinc-900 border-b border-zinc-800 sticky top-0">ORIGINAL</div>}
            {changes.map((change, ci) => {
              if (change.added) return null;
              const lines = change.value.replace(/\n$/, "").split("\n");
              return lines.map((line, li) => {
                if (!change.removed) lineNum.left++;
                const ln = !change.removed ? lineNum.left : ++lineNum.left;
                return (
                  <div key={`l-${ci}-${li}`}
                    className={`flex ${change.removed ? "bg-red-950/40" : ""}`}
                  >
                    <span className="w-10 shrink-0 text-right pr-3 py-0.5 text-zinc-700 select-none border-r border-zinc-800">{ln}</span>
                    <pre className={`flex-1 px-3 py-0.5 leading-5 whitespace-pre ${change.removed ? "text-red-300" : "text-zinc-400"}`}>{line || " "}</pre>
                  </div>
                );
              });
            })}
          </div>

          {/* Right — updated */}
          <div className="flex-1 min-w-0">
            <div className="px-3 py-1.5 text-[10px] text-zinc-600 bg-zinc-900 border-b border-zinc-800 sticky top-0">
              {isNew ? "NEW FILE" : "UPDATED"}
            </div>
            {changes.map((change, ci) => {
              if (change.removed) return null;
              const lines = change.value.replace(/\n$/, "").split("\n");
              return lines.map((line, li) => {
                if (!change.added) lineNum.right++;
                const ln = !change.added ? lineNum.right : ++lineNum.right;
                return (
                  <div key={`r-${ci}-${li}`}
                    className={`flex ${change.added ? "bg-emerald-950/40" : ""}`}
                  >
                    <span className="w-10 shrink-0 text-right pr-3 py-0.5 text-zinc-700 select-none border-r border-zinc-800">{ln}</span>
                    <pre className={`flex-1 px-3 py-0.5 leading-5 whitespace-pre ${change.added ? "text-emerald-300" : "text-zinc-400"}`}>{line || " "}</pre>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
