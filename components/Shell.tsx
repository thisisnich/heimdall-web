"use client";
import AuthGuard from "./AuthGuard";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  console.log("[Shell] Rendering Shell component");
  return (
    <AuthGuard>
      <div className="flex h-full">
        {/* Sidebar - Desktop only */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-full pb-16 md:pb-0">
          {title && (
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex-shrink-0 md:hidden">
              <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
            </header>
          )}
          <main className="flex-1 overflow-y-auto flex flex-col">{children}</main>
        </div>
      </div>
      
      {/* Bottom nav - Mobile only */}
      <BottomNav />
    </AuthGuard>
  );
}

export default Shell;
