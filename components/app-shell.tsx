import type { ReactNode } from "react";

import { StatusBadge } from "@/components/status-badge";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(223,117,58,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(40,74,92,0.18),_transparent_26%),linear-gradient(180deg,_#f6efe6_0%,_#f0e7dc_42%,_#e6ddd0_100%)] text-[#1f130c]">
      <div
        aria-hidden="true"
        className="absolute left-[-8rem] top-16 h-64 w-64 rounded-full bg-[#d9773a]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-4rem] top-0 h-72 w-72 rounded-full bg-[#275266]/15 blur-3xl"
      />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-[#8b6f57]">Vision Text Bridge</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[#1f130c] md:text-5xl">
              提示词模板工作台
            </h1>
          </div>
          <StatusBadge label="MVP" />
        </header>
        <div className="mt-10 flex-1">{children}</div>
      </div>
    </div>
  );
}
