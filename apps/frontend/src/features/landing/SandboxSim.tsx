import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// github.com/Ashu463/react-template — everything a new project starts with
const STARTER = [
  "index.html          ← Tailwind via CDN",
  "package.json        ← react, react-dom, vite",
  "vite.config.ts      ← @ alias",
  "tsconfig.json",
  "eslint.config.js",
  "src/main.tsx",
  "src/App.tsx         ← Vite's counter demo",
  "src/index.css",
];
// an example of what one build adds on top
const WRITTEN = [
  "src/App.tsx         ← rewritten: routes",
  "src/pages/Landing.tsx",
  "src/pages/Dashboard.tsx",
  "src/components/Navbar.tsx",
  "src/components/StatCard.tsx",
  "src/hooks/useTasks.ts",
  "design/screen-dashboard.html",
];

type Status = "none" | "creating" | "restoring" | "installing" | "alive" | "dead" | "recovering";
type Sim = { status: Status; clock: number; expires: number; extended: number; log: string[] };

const BOOT: Partial<Record<Status, [Status, string, number]>> = {
  creating: ["restoring", "Sandbox.create('react-sandbox-node22') · 60 min timeout", 900],
  recovering: ["restoring", "sandbox gone → replaceSandbox() from the same image", 900],
  restoring: ["installing", "restore files from R2 (the starter on a first run)", 900],
  installing: ["alive", "npm install · preview on :5173", 1100],
};

const START: Sim = { status: "none", clock: 0, expires: 0, extended: 0, log: ["no sandbox yet"] };
const add = (s: Sim, line: string) => [...s.log, `t+${s.clock}m  ${line}`].slice(-5);

export function SandboxSim() {
  const [built, setBuilt] = useState(false);
  const [sim, setSim] = useState<Sim>(START);

  // walk the boot sequence: create/recover → restore → install → alive
  useEffect(() => {
    const step = BOOT[sim.status];
    if (!step) return;
    const t = setTimeout(
      () =>
        setSim((s) => ({
          ...s,
          status: step[0],
          log: add(s, step[1]),
          ...(step[0] === "alive" ? { expires: s.clock + 60, extended: s.clock } : {}),
        })),
      step[2],
    );
    return () => clearTimeout(t);
  }, [sim.status]);

  const toolCall = () =>
    setSim((s) => {
      if (s.status === "dead") return { ...s, status: "recovering", log: add(s, "tool call fails · recovering, then retried once") };
      if (s.clock - s.extended >= 10) return { ...s, expires: s.clock + 60, extended: s.clock, log: add(s, "tool call · timeout pushed back to 60 min") };
      return { ...s, log: add(s, "tool call · extended < 10 min ago, skip keepalive") };
    });
  const forward = () =>
    setSim((s) => {
      const clock = s.clock + 10;
      return clock >= s.expires && s.status === "alive"
        ? { ...s, clock, status: "dead", log: add({ ...s, clock }, "timeout reached · sandbox expired") }
        : { ...s, clock };
    });
  const kill = () => setSim((s) => ({ ...s, status: "dead", log: add(s, "sandbox died") }));

  const booting = sim.status in BOOT;
  const left = Math.max(sim.expires - sim.clock, 0);
  const BTN = "rounded-md border border-accent px-2 py-1 text-accent transition-opacity disabled:opacity-40";

  return (
    <div className="space-y-4 rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] tracking-[0.16em] text-accent uppercase">1 · what the agents start from</p>
          <div className="flex overflow-hidden rounded-md border border-border-hover">
            {["starter", "after a build"].map((label, i) => (
              <button
                key={label}
                onClick={() => setBuilt(i === 1)}
                className={cn("px-2 py-0.5 transition-colors", built === (i === 1) ? "bg-accent/15 text-accent" : "hover:text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border-hover bg-surface p-2 leading-relaxed">
          {STARTER.filter((f) => !(built && f.startsWith("src/App.tsx"))).map((f) => (
            <p key={f} className="whitespace-pre">
              {f}
            </p>
          ))}
          {built &&
            WRITTEN.map((f) => (
              <p key={f} className="whitespace-pre text-accent" style={{ animation: "queue-in 0.4s ease-out" }}>
                {f}
              </p>
            ))}
        </div>
        <p className="mt-1.5 text-muted-foreground">
          {built ? "Accent = written by the agents (example files)." : "That's all. No components, no pages, no UI kit."}
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] tracking-[0.16em] text-accent uppercase">2 · lifecycle · drive it</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {sim.status === "none" ? (
            <button onClick={() => setSim((s) => ({ ...s, status: "creating", log: add(s, "run starts · no sandboxId") }))} className={BTN}>
              ▶ start a run
            </button>
          ) : (
            <>
              <button onClick={toolCall} disabled={booting} className={BTN}>
                tool call
              </button>
              <button onClick={forward} disabled={booting || sim.status === "dead"} className={BTN}>
                ⏩ +10 min
              </button>
              <button onClick={kill} disabled={sim.status !== "alive"} className={BTN}>
                💀 kill it
              </button>
              <button onClick={() => setSim(START)} className={BTN}>
                ↻ reset
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn("w-20", sim.status === "alive" ? "text-accent" : "")}
            style={sim.status === "dead" ? { color: "var(--color-accent-from)" } : undefined}
          >
            {sim.status}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-hover">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: sim.status === "alive" ? `${(left / 60) * 100}%` : "0%" }}
            />
          </div>
          <span className="w-16 text-right">{sim.status === "alive" ? `${left}m left` : "—"}</span>
        </div>
        <div className="mt-2 space-y-0.5 rounded-lg border border-border-hover bg-surface p-2 text-[10px]">
          {sim.log.map((l, i) => (
            <p key={`${sim.log.length}-${i}`} className={i === sim.log.length - 1 ? "text-foreground" : ""}>
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
