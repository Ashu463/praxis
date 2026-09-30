import type { ReactNode } from "react";
import { StatusLine } from "@/features/shell/StatusLine";

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <StatusLine />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-12">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
              </div>
              {actions}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
