import { Flowchart, type FlowEdge, type FlowNode } from "@/features/landing/Flowchart";

// three side-by-side lanes share these x positions
const LANES = [15, 180, 345];
const lane = (y: number, h: number, title: (i: number) => string, sub: string, kind: FlowNode[6]): FlowNode[] =>
  LANES.map((x, i) => [x, y, 140, h, title(i), sub, kind]);
const laneArrows = (from: number, to: number): FlowEdge[] => LANES.map((x) => [`M${x + 70},${from} V${to}`, "", 0, 0]);

// simple path, uiExpert.ts generateDesigns → fetchDesigns → saveDesigns
const DESIGN_NODES: FlowNode[] = [
  [150, 8, 200, 38, "User prompt", "+ semantic memory + skills", "step"],
  [150, 76, 200, 44, "FramePrompts", "LLM · 3 design directions", "llm"],
  ...lane(168, 44, (i) => `Prompt ${"ABC"[i]}`, "layout · density · type", "step"),
  ...lane(240, 44, () => "Stitch generate", "own Stitch project", "step"),
  ...lane(312, 44, () => "Fetch HTML", "polls up to 5×", "step"),
  [150, 404, 200, 38, "saveDesigns", "Postgres · Design rows", "step"],
  [150, 470, 200, 40, "User picks one", "pause", "pause"],
  [150, 538, 200, 36, "run.simple → Inngest", "", "end"],
];
const DESIGN_EDGES: FlowEdge[] = [
  ["M250,46 V72", "", 0, 0],
  ["M250,120 V140 H85 V164", "", 0, 0],
  ["M250,140 V164", "in parallel", 256, 156],
  ["M250,140 H415 V164", "", 0, 0],
  ...laneArrows(212, 236),
  ...laneArrows(284, 308),
  ["M85,356 V423 H146", "", 0, 0],
  ["M250,356 V400", "", 0, 0],
  ["M415,356 V423 H354", "", 0, 0],
  ["M250,442 V466", "", 0, 0],
  ["M250,510 V534", "", 0, 0],
];

export function DesignFlow() {
  return <Flowchart nodes={DESIGN_NODES} edges={DESIGN_EDGES} height={580} label="Design pick flowchart" />;
}

// one DAG level in orchestrator.ts runLevel + runMergeGate
const ORCH_NODES: FlowNode[] = [
  [150, 8, 200, 38, "Level i of the DAG", "2+ tasks", "step"],
  ...lane(76, 44, (i) => `worktree task-${i + 3}`, "own branch · own folder", "step"),
  ...lane(148, 44, () => "Coder / UIExpert", "runs in parallel", "step"),
  [150, 222, 200, 44, "git merge task-N", "one task at a time", "step"],
  [384, 224, 116, 40, "Resolve conflict", "LLM, per file", "llm"],
  [150, 294, 200, 40, "npm install", "if package.json changed", "step"],
  [150, 362, 200, 44, "Merge gate", "build → tester → debugger ≤ 3", "gate"],
  [150, 434, 200, 38, "Sync R2 · save summaries", "", "step"],
  [150, 500, 200, 36, "Next level", "", "end"],
];
const ORCH_EDGES: FlowEdge[] = [
  ["M250,46 V58 H85 V72", "", 0, 0],
  ["M250,46 V72", "", 0, 0],
  ["M250,58 H415 V72", "", 0, 0],
  ...laneArrows(120, 144),
  ["M85,192 V244 H146", "", 0, 0],
  ["M250,192 V218", "", 0, 0],
  ["M415,192 V206 H330 V218", "", 0, 0],
  ["M350,244 H380", "conflict", 352, 238],
  ["M250,266 V290", "", 0, 0],
  ["M250,334 V358", "", 0, 0],
  ["M250,406 V430", "pass", 256, 422],
  ["M250,472 V496", "", 0, 0],
];

export function OrchestratorFlow() {
  return <Flowchart nodes={ORCH_NODES} edges={ORCH_EDGES} height={544} label="Orchestrator level flowchart" />;
}

// [id, task, agent, dependency] — an illustrative plan that follows PLAN_TASKS_PROMPT's rules
const PLAN: [number, string, "uiExpert" | "coder", number[]][] = [
  [1, "Landing screen", "uiExpert", []],
  [2, "Dashboard screen", "uiExpert", []],
  [3, "Dashboard chart logic", "coder", [2]],
  [4, "Wire screens into app root", "coder", [1, 2, 3]],
];

// the same Kahn's pass as services/dag.ts TopologicalSortParallel, run on PLAN
const dependents = new Map(PLAN.map(([id]) => [id, PLAN.filter((t) => t[3].includes(id)).map((t) => t[0])]));
const indegree = new Map(PLAN.map(([id, , , deps]) => [id, deps.length]));
const LEVELS: number[][] = [];
{
  const left = new Map(indegree);
  let frontier = PLAN.filter(([id]) => left.get(id) === 0).map(([id]) => id);
  while (frontier.length) {
    LEVELS.push(frontier);
    const next: number[] = [];
    for (const id of frontier)
      for (const d of dependents.get(id) ?? []) {
        left.set(d, left.get(d)! - 1);
        if (left.get(d) === 0) next.push(d);
      }
    frontier = next;
  }
}

const SCHEMA = `class PlannerTodo {
  id                int
  task              string
  description       string
  agent             "coder" | "uiExpert"
  designRef         string?   // screen id → its Stitch design
  status            "pending" | "completed"
  dependency        int[]     // ids this task waits on
  expectedToolCalls int
}`;

const STEP = "mb-1.5 font-mono text-[10px] tracking-[0.16em] text-accent uppercase";
const CHIP = "rounded border border-border-hover bg-surface px-1.5 py-0.5 text-foreground";

export function PlannerDag() {
  return (
    <div className="space-y-4 rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      <div>
        <p className={STEP}>1 · the plan schema (BAML)</p>
        <pre className="overflow-x-auto rounded-lg border border-border-hover bg-surface p-2.5 text-[10.5px] leading-relaxed text-foreground">
          {SCHEMA}
        </pre>
      </div>

      <div>
        <p className={STEP}>2 · an example plan</p>
        <div className="space-y-1">
          {PLAN.map(([id, task, agent, deps]) => (
            <div key={id} className="flex items-center gap-2">
              <span className={CHIP}>#{id}</span>
              <span className="flex-1 text-foreground">{task}</span>
              <span className="text-accent">{agent}</span>
              <span className="w-16 text-right">[{deps.join(", ")}]</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className={STEP}>3 · adjacency list + in-degree</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {PLAN.map(([id]) => (
            <div key={id} className="flex items-center gap-2">
              <span className={CHIP}>#{id}</span>
              <span>→ [{(dependents.get(id) ?? []).map((d) => `#${d}`).join(", ")}]</span>
              <span className="ml-auto">in {indegree.get(id)}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-muted-foreground">
          in-degree = how many tasks it still waits on. An unknown id or a cycle throws and fails the run.
        </p>
      </div>

      <div>
        <p className={STEP}>4 · levels (Kahn&rsquo;s algorithm)</p>
        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((lvl, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-accent">→</span>}
              <div className="rounded-lg border border-accent/50 p-1.5">
                <p className="mb-1 text-[9px]">level {i}</p>
                <div className="flex gap-1">
                  {lvl.map((id) => (
                    <span key={id} className={CHIP}>
                      #{id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-muted-foreground">
          Take every task with in-degree 0 as one level, run them in parallel, then subtract 1 from each dependent. Repeat.
        </p>
      </div>
    </div>
  );
}
