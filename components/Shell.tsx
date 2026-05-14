"use client";
import AuthGuard from "./AuthGuard";
import BottomNav from "./BottomNav";

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  console.log("[Shell] Rendering Shell component");
  return (
    <AuthGuard>
      <div className="flex flex-col h-full pb-16">
        {title && (
          <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex-shrink-0">
            <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
          </header>
        )}
        <main className="flex-1 overflow-y-auto flex flex-col">{children}</main>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}

export default Shell;
