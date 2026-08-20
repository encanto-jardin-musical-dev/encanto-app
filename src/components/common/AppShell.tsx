"use client";

import { Sidebar } from "@/components/common/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
}
