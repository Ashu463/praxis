import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DagGraph, type TaskStatus, type Todo } from "@/features/build/DagView";
import { cn } from "@/lib/utils";

// Illustrative replay of one build, in the product's own three phases:
// Stitch design choices → the planner's DAG executing → the finished app.
const PHASES = ["design", "plan", "app"] as const;
type Phase = (typeof PHASES)[number];

const TODOS: Todo[] = [
  {
    taskId: 1,
    task: "Create shared data layer",
    agent: "coder",
    dependency: [],
    status: "PENDING",
  },
  {
    taskId: 2,
    task: "Implement Boards list",
    agent: "uiExpert",
    dependency: [1],
    status: "PENDING",
  },
  {
    taskId: 3,
    task: "Implement Board view",
    agent: "uiExpert",
    dependency: [1],
    status: "PENDING",
  },
  {
    taskId: 4,
    task: "Implement Card modal",
    agent: "uiExpert",
    dependency: [1],
    status: "PENDING",
  },
  {
    taskId: 5,
    task: "Connect Boards to data",
    agent: "coder",
    dependency: [2],
    status: "PENDING",
  },
  {
    taskId: 6,
    task: "Wire drag and drop",
    agent: "coder",
    dependency: [3],
    status: "PENDING",
  },
  {
    taskId: 7,
    task: "Wire Card modal",
    agent: "coder",
    dependency: [4],
    status: "PENDING",
  },
  {
    taskId: 8,
    task: "Wire screens into router",
    agent: "coder",
    dependency: [5, 6, 7],
    status: "PENDING",
  },
];

// Timed events, not snapshots: tasks in one level start a few hundred ms apart
// and finish at their own pace, the way a real run hands off between levels.
type Ev = { at: number; set?: Record<number, TaskStatus>; log?: string };
const R: TaskStatus = "running",
  D: TaskStatus = "done",
  F: TaskStatus = "failed";
const PLAN_EVENTS: Ev[] = [
  { at: 0, log: "planner: 8 tasks · 4 levels" },
  { at: 700, set: { 1: R }, log: "coder: creating the data layer" },
  { at: 2100, set: { 1: D } },
  {
    at: 2400,
    set: { 2: R },
    log: "designers: 3 screens in parallel worktrees",
  },
  { at: 2700, set: { 3: R } },
  { at: 3000, set: { 4: R } },
  { at: 4500, set: { 2: D } },
  { at: 5000, set: { 4: F }, log: "tester: Card modal failed the build" },
  { at: 5600, set: { 3: D } },
  { at: 6300, set: { 4: R }, log: "debugger: patched · retry 2/3" },
  { at: 7700, set: { 4: D }, log: "merge gate: green · next level" },
  { at: 8100, set: { 5: R } },
  { at: 8400, set: { 6: R } },
  { at: 8700, set: { 7: R }, log: "coders: wiring each screen to data" },
  { at: 9900, set: { 5: D } },
  { at: 10300, set: { 7: D } },
  { at: 11100, set: { 6: D } },
  { at: 11500, set: { 8: R }, log: "coder: wiring screens into the router" },
  { at: 12900, set: { 8: D }, log: "run: completed · preview is live" },
];
const DESIGN_MS = 7000;
const PLAN_MS = 14300;
const APP_MS = 7500;
const DURATION: Record<Phase, number> = {
  design: DESIGN_MS,
  plan: PLAN_MS,
  app: APP_MS,
};

export function BuildShowcase() {
  const [phase, setPhase] = useState<Phase>("design");
  const [picked, setPicked] = useState(false);
  const [statuses, setStatuses] = useState<Record<number, TaskStatus>>({});
  const [planLog, setPlanLog] = useState(PLAN_EVENTS[0]!.log!);
  // bumping this restarts the timeline from whichever phase was clicked
  const [start, setStart] = useState<{ from: Phase; n: number }>({
    from: "design",
    n: 0,
  });

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => ids.push(setTimeout(fn, ms));

    const run = (p: Phase) => {
      setPhase(p);
      if (p === "design") {
        setPicked(false);
        at(4200, () => setPicked(true));
      }
      if (p === "plan") {
        setStatuses({});
        setPlanLog(PLAN_EVENTS[0]!.log!);
        for (const e of PLAN_EVENTS) {
          at(e.at, () => {
            if (e.set) setStatuses((prev) => ({ ...prev, ...e.set }));
            if (e.log) setPlanLog(e.log);
          });
        }
      }
      const next = PHASES[(PHASES.indexOf(p) + 1) % PHASES.length]!;
      at(DURATION[p], () => run(next));
    };
    run(start.from);
    return () => ids.forEach(clearTimeout);
  }, [start]);

  const log =
    phase === "design"
      ? picked
        ? "user: picked variant 2 · handing to the planner"
        : "designer: 3 Stitch variants ready"
      : phase === "plan"
        ? planLog
        : "sandbox: preview is live on phone and tablet";
  const colon = log.indexOf(":");

  return (
    <div className="overflow-hidden rounded-2xl border border-border-hover bg-surface/70 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          {PHASES.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && <span className="text-border-hover">→</span>}
              <button
                onClick={() => setStart((s) => ({ from: p, n: s.n + 1 }))}
                aria-pressed={p === phase}
                className={cn(
                  "rounded-md px-2 py-1 transition-colors hover:bg-surface-hover hover:text-foreground",
                  p === phase && "text-accent",
                )}
              >
                0{i + 1} {p}
              </button>
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="status-dot h-[7px] w-[7px] rounded-full bg-accent" />
          replay
        </span>
      </div>

      <div className="relative h-[420px]">
        <Fade on={phase === "design"}>
          <DesignPhase picked={picked} />
        </Fade>
        <Fade on={phase === "plan"}>
          <PlanPhase statuses={statuses} />
        </Fade>
        <Fade on={phase === "app"}>
          <AppPhase />
        </Fade>
      </div>

      <p className="border-t border-border px-4 py-2.5 font-mono text-xs text-muted">
        {colon > 0 ? (
          <>
            <span className="text-foreground">{log.slice(0, colon + 1)}</span>
            {log.slice(colon + 1)}
          </>
        ) : (
          log
        )}
      </p>
    </div>
  );
}

function Fade({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-all duration-700",
        on ? "opacity-100" : "pointer-events-none scale-[0.98] opacity-0",
      )}
    >
      {on && children}
    </div>
  );
}

// ---------- phase 1: prompt → three curved arrows → Stitch UI choices ----------

const CHOICES = [
  { bg: "#eef1f6", bar: "#3b82f6", card: "#ffffff", ink: "#c7cfdc" },
  {
    bg: "#111119",
    bar: "var(--color-accent)",
    card: "#1b1b26",
    ink: "#34344a",
  },
  { bg: "#1d1510", bar: "#f59e0b", card: "#2a1f17", ink: "#4a3a2c" },
];

function DesignPhase({ picked }: { picked: boolean }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(id);
  }, []);
  const xs = [100, 300, 500];

  return (
    <div className="absolute inset-0 mx-auto max-w-[600px]">
      <svg viewBox="0 0 600 400" className="absolute inset-0 h-full w-full">
        {xs.map((x, i) => (
          <path
            key={x}
            d={
              i === 1
                ? "M300,92 C300,150 304,170 300,212"
                : `M300,92 C300,170 ${x},130 ${x},212`
            }
            pathLength={1}
            fill="none"
            stroke={
              picked && i === 1
                ? "var(--color-accent)"
                : "var(--color-muted-foreground)"
            }
            strokeWidth={1.6}
            markerEnd="url(#showcase-arrow)"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: drawn ? 0 : 1,
              transition: `stroke-dashoffset 1s cubic-bezier(.65,0,.35,1) ${0.2 + i * 0.25}s, stroke .4s`,
            }}
          />
        ))}
        <defs>
          <marker
            id="showcase-arrow"
            markerWidth={8}
            markerHeight={8}
            refX={4}
            refY={4}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-muted-foreground)" />
          </marker>
        </defs>
      </svg>

      <div className="absolute top-[36px] left-1/2 w-[260px] -translate-x-1/2 rounded-xl border border-border-hover bg-background px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          prompt
        </p>
        <p className="mt-0.5 text-sm">Build a kanban board for my team</p>
      </div>

      {CHOICES.map((c, i) => (
        <div
          key={i}
          className={cn(
            // centred via the inline transform below, which also carries the rise-in offset
            "absolute top-[222px] w-[160px] rounded-xl border p-2 transition-all duration-500",
            picked && i === 1
              ? "border-accent shadow-[0_0_24px_-4px_var(--color-accent)]"
              : "border-border-hover",
            picked && i !== 1 && "opacity-40",
          )}
          style={{
            left: `${(xs[i]! / 600) * 100}%`,
            opacity: drawn ? undefined : 0,
            transform: `translateX(-50%) translateY(${drawn ? 0 : 10}px)`,
            transition: `all .6s cubic-bezier(.34,1.56,.64,1) ${1.1 + i * 0.25}s`,
          }}
        >
          <MiniBoard c={c} />
          <p className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
            UI choice {i + 1}
            {picked && i === 1 && <span className="text-accent">✓ picked</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function MiniBoard({ c }: { c: (typeof CHOICES)[number] }) {
  return (
    <div
      className="h-[84px] overflow-hidden rounded-md p-1.5"
      style={{ background: c.bg }}
    >
      <div
        className="mb-1.5 h-1.5 w-1/2 rounded-full"
        style={{ background: c.bar }}
      />
      <div className="grid grid-cols-3 gap-1">
        {[3, 2, 1].map((n, col) => (
          <div key={col} className="flex flex-col gap-1">
            {Array.from({ length: n }).map((_, k) => (
              <div
                key={k}
                className="h-3.5 rounded-sm"
                style={{
                  background: c.card,
                  boxShadow: `inset 0 -2px 0 ${c.ink}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- phase 2: the real DAG view, driven by a scripted replay ----------

function PlanPhase({ statuses }: { statuses: Record<number, TaskStatus> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // fit the graph to the panel width; DagGraph corrects its edges for the scale
  useLayoutEffect(() => {
    const fit = () => {
      const box = boxRef.current,
        inner = innerRef.current;
      if (!box || !inner) return;
      setScale(Math.min(1, (box.clientWidth - 32) / inner.offsetWidth));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})` }}
        className="origin-center"
      >
        <DagGraph
          compact
          todos={TODOS}
          statusOf={(t) => statuses[t.taskId] ?? "pending"}
        />
      </div>
    </div>
  );
}

// ---------- phase 3: the finished app on phone and tablet ----------

const COLUMNS = [
  { name: "To do", cards: ["Landing copy", "Invite flow"] },
  { name: "Doing", cards: ["Drag and drop", "Card modal"] },
  { name: "Done", cards: ["Auth", "Boards list", "Data layer"] },
];

function AppPhase() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 px-6">
      {/* tablet */}
      <div className="reveal is-in w-[330px] rounded-[22px] border-[6px] border-[#26263a] bg-[#111119] p-3 shadow-2xl">
        <AppHeader />
        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map((col) => (
            <div key={col.name} className="rounded-lg bg-[#16161f] p-1.5">
              <p className="mb-1.5 px-1 font-mono text-[9px] text-muted">
                {col.name}
              </p>
              <div className="flex flex-col gap-1.5">
                {col.cards.map((card) => (
                  <div
                    key={card}
                    className="rounded-md border border-border-hover bg-[#1b1b26] px-2 py-1.5 text-[9.5px]"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* phone */}
      <div className="reveal is-in w-[150px] rounded-[26px] border-[6px] border-[#26263a] bg-[#111119] p-2.5 shadow-2xl [animation-delay:250ms]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#26263a]" />
        <AppHeader />
        <p className="mb-1.5 font-mono text-[9px] text-muted">Doing</p>
        <div className="flex flex-col gap-1.5">
          {["Drag and drop", "Card modal", "Invite flow", "Landing copy"].map(
            (card, i) => (
              <div
                key={card}
                className={cn(
                  "rounded-md border bg-[#1b1b26] px-2 py-1.5 text-[9.5px]",
                  i === 0 ? "border-accent" : "border-border-hover",
                )}
              >
                {card}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="font-display text-[11px] font-semibold">Team board</span>
      <span className="bg-gradient-accent rounded-full px-2 py-0.5 text-[8px] font-semibold text-accent-foreground">
        + card
      </span>
    </div>
  );
}
