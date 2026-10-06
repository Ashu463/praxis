import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Ev = { label: string; write?: string; sync: "none" | "file" | "all" };

// single agent: agent.ts syncs per write, a full SyncR2 per edit
const SIMPLE: Ev[] = [
  { label: "read src/App.tsx", sync: "none" },
  { label: "writeFile src/pages/Landing.tsx", write: "src/pages/Landing.tsx", sync: "file" },
  { label: "writeFile src/components/Navbar.tsx", write: "src/components/Navbar.tsx", sync: "file" },
  { label: "runCommand npm run build", sync: "none" },
  { label: "editFile src/App.tsx → full SyncR2", write: "src/App.tsx", sync: "all" },
  { label: "writeFile src/hooks/useTasks.ts", write: "src/hooks/useTasks.ts", sync: "file" },
];
// parallel agents: nothing leaves the sandbox until the level's own sync-r2 step
const PARALLEL: Ev[] = [
  { label: "level-0 · task-1 writes in its worktree", write: "src/pages/Landing.tsx", sync: "none" },
  { label: "level-0 · task-2 writes in its worktree", write: "src/pages/Dashboard.tsx", sync: "none" },
  { label: "level-0 · git merge task-1, task-2", sync: "none" },
  { label: "level-0 · merge gate: build ✓ boot ✓", sync: "none" },
  { label: "step.run(level-0-sync-r2)", sync: "all" },
  { label: "level-1 · task-3 writes on main", write: "src/components/StatCard.tsx", sync: "none" },
  { label: "level-1 · merge gate: build ✓ boot ✓", sync: "none" },
  { label: "step.run(level-1-sync-r2)", sync: "all" },
];

const BASE = ["index.html", "package.json", "src/main.tsx", "src/App.tsx"];
type Sim = { i: number; sandbox: string[]; r2: string[]; flash: string[] };
const START: Sim = { i: -1, sandbox: BASE, r2: BASE, flash: [] };

export function R2Sync() {
  const [mode, setMode] = useState<"simple" | "parallel">("simple");
  const [sim, setSim] = useState<Sim>(START);
  const script = mode === "simple" ? SIMPLE : PARALLEL;

  useEffect(() => {
    const t = setInterval(
      () =>
        setSim((s) => {
          // pause one beat on the last event, then start over
          if (s.i >= script.length) return START;
          const i = s.i + 1;
          const ev = script[i];
          if (!ev) return { ...s, i, flash: [] };
          const sandbox = ev.write && !s.sandbox.includes(ev.write) ? [...s.sandbox, ev.write] : s.sandbox;
          const synced = ev.sync === "all" ? sandbox : ev.sync === "file" && ev.write ? [ev.write] : [];
          return { i, sandbox, r2: [...new Set([...s.r2, ...synced])], flash: synced };
        }),
      1300,
    );
    return () => clearInterval(t);
  }, [script]);

  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      <div className="mb-3 flex overflow-hidden rounded-md border border-border-hover">
        {(["simple", "parallel"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setSim(START);
            }}
            className={cn("flex-1 py-1 transition-colors", mode === m ? "bg-accent/15 text-accent" : "hover:text-foreground")}
          >
            {m === "simple" ? "single agent" : "parallel agents"}
          </button>
        ))}
      </div>

      <div className="mb-3 space-y-0.5">
        {script.map((ev, i) => (
          <p
            key={ev.label}
            className={cn(
              "flex justify-between rounded px-1.5 py-0.5 transition-colors",
              i === sim.i ? "bg-accent/10 text-foreground" : i < sim.i ? "" : "opacity-40",
            )}
          >
            <span>{ev.label}</span>
            <span className={ev.sync === "none" ? "" : "text-accent"}>
              {ev.sync === "none" ? "—" : ev.sync === "file" ? "↑ this file" : "↑ everything"}
            </span>
          </p>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["sandbox", sim.sandbox],
            ["R2 · users/…/files/", sim.r2],
          ] as const
        ).map(([title, files], col) => (
          <div key={title} className="rounded-lg border border-border-hover bg-surface p-2">
            <p className="mb-1 text-accent">{title}</p>
            {files.map((f) => {
              const unsynced = col === 0 && !sim.r2.includes(f);
              return (
                <p
                  key={f}
                  className={cn(
                    "truncate rounded px-1 transition-colors duration-500",
                    col === 1 && sim.flash.includes(f) ? "bg-accent/25 text-foreground" : "",
                    unsynced ? "text-foreground" : "",
                  )}
                >
                  {f}
                  {unsynced && <span style={{ color: "var(--color-accent-from)" }}> · unsynced</span>}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
