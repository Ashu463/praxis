import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// real step names from run-complex-task (orchestrator.ts / callAgent.ts)
const STEPS = ["enumerate-screens", "plan-tasks", "level-0-spawn", "level-0-merge-gate", "level-0-sync-r2", "level-1-spawn", "summarize"];

type Phase = "running" | "waiting" | "replaying" | "complete";
type Sim = { cursor: number; progress: number; attempt: number; phase: Phase; wait: number; replay: number; log: string[] };

const START: Sim = { cursor: 0, progress: 0, attempt: 1, phase: "running", wait: 0, replay: 0, log: ["attempt 1 · function invoked"] };
const TICK = 300;
const log = (s: Sim, line: string) => [...s.log, line].slice(-5);

// Crash the worker mid-step and watch Inngest call the function again: finished steps return their saved result, only the broken one re-runs.
export function InngestSim() {
  const [sim, setSim] = useState<Sim>(START);

  useEffect(() => {
    const t = setInterval(
      () =>
        setSim((s) => {
          if (s.phase === "running") {
            if (s.progress < 100) return { ...s, progress: s.progress + 10 };
            const cursor = s.cursor + 1;
            const next = { ...s, cursor, progress: 0, log: log(s, `✓ ${STEPS[s.cursor]} ran · result saved`) };
            return cursor === STEPS.length ? { ...next, phase: "complete" } : next;
          }
          if (s.phase === "waiting") {
            if (s.wait > 0) return { ...s, wait: s.wait - TICK };
            return { ...s, phase: "replaying", replay: 0, attempt: s.attempt + 1, log: log(s, `attempt ${s.attempt + 1} · invoked again from the top`) };
          }
          if (s.phase === "replaying") {
            if (s.replay < s.cursor) {
              return { ...s, replay: s.replay + 1, log: log(s, `↺ ${STEPS[s.replay]} · saved result returned, 0ms`) };
            }
            return { ...s, phase: "running", progress: 0 };
          }
          return s;
        }),
      TICK,
    );
    return () => clearInterval(t);
  }, []);

  const crash = () =>
    setSim((s) =>
      s.phase === "running" ? { ...s, phase: "waiting", wait: 1500, log: log(s, `✗ ${STEPS[s.cursor]} crashed · worker died`) } : s,
    );

  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      <div className="mb-3 flex items-center justify-between">
        <span>
          run-complex-task · attempt <span className="text-accent">{sim.attempt}</span>
        </span>
        {sim.phase === "complete" ? (
          <button onClick={() => setSim(START)} className="rounded-md border border-accent px-2 py-1 text-accent">
            ↻ run again
          </button>
        ) : (
          <button
            onClick={crash}
            disabled={sim.phase !== "running"}
            className="rounded-md border border-accent px-2 py-1 text-accent transition-opacity disabled:opacity-40"
          >
            💥 crash the worker
          </button>
        )}
      </div>

      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const done = i < sim.cursor;
          const active = i === sim.cursor && sim.phase !== "complete";
          const failed = active && sim.phase !== "running";
          const replayed = sim.phase === "replaying" && i === sim.replay - 1;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1 transition-colors duration-300",
                replayed ? "border-accent bg-accent/15" : failed ? "border-accent-from/60" : active ? "border-accent/60" : "border-border-hover",
              )}
            >
              <span className="w-4 text-center">{done ? "✓" : failed ? "✗" : active ? "▸" : "·"}</span>
              <span className={cn("flex-1", done || active ? "text-foreground" : "")}>step.run(&quot;{step}&quot;)</span>
              {active && sim.phase === "running" && (
                <div className="h-1 w-20 overflow-hidden rounded-full bg-border-hover">
                  <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${sim.progress}%` }} />
                </div>
              )}
              {failed && <span style={{ color: "var(--color-accent-from)" }}>{sim.phase === "waiting" ? "retrying…" : "waiting"}</span>}
              {done && sim.attempt > 1 && <span className="text-[9px] text-accent">saved</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-0.5 rounded-lg border border-border-hover bg-surface p-2 text-[10px]">
        {sim.log.map((l, i) => (
          <p key={`${sim.log.length}-${i}`} className={i === sim.log.length - 1 ? "text-foreground" : ""}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
