import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";
import { RetryChip } from "@/features/landing/RetryChip";
import { QueueSim } from "@/features/landing/QueueSim";
import { BootstrapFlow } from "@/features/landing/BootstrapFlow";
import { AgentLoop } from "@/features/landing/AgentLoop";
import { DesignFlow, OrchestratorFlow, PlannerDag } from "@/features/landing/ArchitectureFlows";
import { InngestSim } from "@/features/landing/InngestSim";
import { TraceView } from "@/features/landing/TraceView";
import { SandboxSim } from "@/features/landing/SandboxSim";
import { R2Sync } from "@/features/landing/R2Sync";

const GH = "https://github.com/Ashu463/lovable/blob/master/";
const src = (path: string, line: number) => ({
  label: `${path.split("/").pop()}:${line}`,
  href: `${GH}${path}#L${line}`,
});

type Info = {
  tag: string;
  title: string;
  body: string;
  points: string[];
  links: { label: string; href: string }[];
  visual?: ReactNode;
  pointsTitle?: string;
};

// Every line below is taken from the code it links to — keep it that way when editing.
const INFO: Record<string, Info> = {
  browser: {
    tag: "client · react",
    title: "Browser",
    body: "Built with Claude Code as a Vite + React 19 + TypeScript app, styled with Tailwind v4 and shadcn/ui components on Radix primitives.",
    points: [
      "react-router v7 for pages; one RunProvider tracks the run as a state machine — running, clarification_needed, select_design, completed, failed",
      "Live events come over graphql-sse, which POSTs the subscription so it can carry the Authorization header",
      "Event and response types are imported from packages/agents, never redefined",
      "Code tab is CodeMirror; icons are lucide-react",
    ],
    links: [
      src("apps/frontend/src/lib/run.tsx", 99),
      src("apps/frontend/src/lib/gqlStream.ts", 14),
    ],
  },
  backend: {
    tag: "backend · :3000",
    title: "Backend + job queue",
    body: "createRun saves a Run row, drops a job into the BullMQ queue \"run-agent\" in Redis and returns immediately. A worker running 5 jobs at a time pulls them oldest-first and starts the agent.",
    points: [],
    visual: <QueueSim />,
    links: [
      src("apps/backend/src/graphql/server.ts", 16),
      src("apps/backend/src/graphql/modules/chat.ts", 96),
      src("apps/backend/src/lib/worker.ts", 29),
    ],
  },
  stores: {
    tag: "state",
    title: "Postgres + Redis",
    body: "Redis holds the job queue and a live pub/sub channel per run. Postgres (via Prisma) is the record — here's what goes into its two core tables.",
    points: [],
    visual: (
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            [
              "Project",
              "one per app a user builds",
              [
                ["userId", "who owns it"],
                ["name", "set by the LLM after the first build"],
                ["isComplex", "cached complexity verdict, so it's checked once"],
                ["isStarred · isArchived", "showcase and soft-delete flags"],
              ],
            ],
            [
              "Run",
              "one per prompt sent to a project",
              [
                ["userPrompt", "what the user asked"],
                ["status", "IN_PROGRESS → a waiting state → COMPLETED / FAILED"],
                ["sandboxId", "lets the next run reconnect to the same E2B box"],
                ["summary", "what got built, or the chat reply"],
                ["context + session snapshots", "agent state saved as it works, so a crashed run can be summarised"],
              ],
            ],
          ] as const
        ).map(([table, what, cols]) => (
          <div key={table} className="rounded-xl border border-border-hover bg-background/40 p-3">
            <p className="font-mono text-xs text-accent">{table}</p>
            <p className="mb-2 text-[11px] text-muted-foreground">{what}</p>
            <ul className="space-y-1.5 text-xs">
              {cols.map(([col, meaning]) => (
                <li key={col}>
                  <span className="font-mono text-foreground">{col}</span>
                  <span className="text-muted"> — {meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
    links: [
      src("apps/backend/prisma/schema.prisma", 51),
      src("apps/backend/src/graphql/modules/internal.ts", 9),
    ],
  },
  prep: {
    tag: "preparatory stage · CallAgent",
    title: "Bootstrap gates",
    body: "Every question the user might need to answer gets asked here, before any code is written. Each pause ends the job; the user's answer re-queues the run and it skips the gates it already passed.",
    points: [],
    visual: <BootstrapFlow />,
    links: [
      src("packages/agents/agent/callAgent.ts", 56),
      src("packages/agents/agent/callAgent.ts", 291),
    ],
  },
  inngest: {
    tag: "durable engine · :8288",
    title: "Inngest trigger",
    body: "Inngest is a durable workflow engine: split a long job into named steps and it saves each finished step's result, like save points in a game. Crash the worker below and watch only the broken step re-run.",
    points: [],
    visual: <InngestSim />,
    links: [
      src("packages/agents/agent/callAgent.ts", 441),
      src("packages/agents/agent/callAgent.ts", 533),
    ],
  },
  langfuse: {
    tag: "observability · langfuse",
    title: "Langfuse tracing",
    body: "Every run is one Langfuse trace on OpenTelemetry: spans time the phases, every BAML call is a generation with its model, tokens and attempts, and events mark retries and conflicts.",
    points: [],
    visual: <TraceView />,
    links: [
      src("packages/agents/agent/utils/tracing.ts", 34),
      src("packages/agents/agent/utils/tracing.ts", 74),
      src("apps/backend/src/telemetry/langfuse.ts", 3),
    ],
  },
  design: {
    tag: "simple path · design",
    title: "Design pick · Stitch",
    body: "One LLM call writes 3 Stitch prompts that each take a different design direction — layout, density, typography, visual weight, not just a colour swap. Stitch turns each prompt into an HTML screen, and the user picks one.",
    points: [],
    visual: <DesignFlow />,
    links: [
      src("packages/agents/agent/subagents/uiExpert.ts", 55),
      src("packages/agents/agent/tools/stitch.ts", 12),
    ],
  },
  agent: {
    tag: "simple path · run-simple-task",
    title: "Single agent",
    body: "One generalist agent builds the whole app on top of the picked design, inside a single Inngest step. Each turn it picks one tool, sees the result, and goes again.",
    points: [],
    visual: (
      <AgentLoop
        baml="AgentLLMCall"
        feed={["system prompt", "skills", "user prompt", "picked design HTML", "semantic memory", "prior runs", "repo tree", "tool results so far"]}
        tools={["read", "writeFile", "editFile", "delete", "runCommand", "getSkill", "stitch", "done", "abort"]}
        mcps={["tavily · web search", "context7 · library docs", "apify · scraping"]}
        skills={["project-conventions", "design-system", "dependency-policy", "ui-base-template", "+4 on demand via getSkill"]}
        footer="≤ 25 iterations · each LLM call retried up to 5× · context compacted past ~100k tokens · ends on done or abort"
      />
    ),
    links: [
      src("packages/agents/agent/agent.ts", 81),
      src("packages/agents/agent/callAgent.ts", 558),
    ],
  },
  orch: {
    tag: "complex path · run-complex-task",
    title: "Orchestrator",
    body: "Walks the DAG one level at a time, each phase an Inngest step. With 2+ tasks in a level, each gets its own git worktree so parallel agents can't overwrite each other; a single-task level runs straight on the main branch.",
    visual: <OrchestratorFlow />,
    pointsTitle: "sandbox lifecycle",
    points: [
      "One E2B sandbox per run, shared by every parallel task — reconnected by id, or created from react-sandbox-node22 with a 1-hour timeout",
      "A fresh sandbox restores the project from R2 (or a React starter on the first run), then runs npm install",
      "While it's in use the timeout is pushed back, at most every 10 minutes; a dead sandbox is replaced, restored and the call retried once",
      "Worktrees share the main app's node_modules through a symlink, so parallel tasks don't reinstall",
      "It's never killed explicitly — it simply expires on its timeout",
    ],
    links: [
      src("packages/agents/agent/orchestrator.ts", 149),
      src("packages/agents/agent/utils/gitWorktree.ts", 44),
      src("packages/agents/agent/utils/sandbox.ts", 57),
    ],
  },
  dag: {
    tag: "complex path · planner",
    title: "Planner → DAG",
    body: "EnumerateScreens lists up to 4 screens, then PlanTasks turns them into up to 10 typed tasks while one Stitch design per screen generates alongside. The plan becomes a DAG, and the DAG becomes levels that can run in parallel.",
    points: [],
    visual: <PlannerDag />,
    links: [
      src("packages/agents/baml_src/agents.baml", 148),
      src("packages/agents/agent/services/dag.ts", 87),
      src("packages/agents/agent/utils/planner.ts", 57),
    ],
  },
  coder: {
    tag: "subagent",
    title: "Coder",
    body: "Writes the code for one planned task. It only sees its task, what the tasks it depends on already built, and the repo.",
    points: [],
    visual: (
      <AgentLoop
        baml="CoderAgent"
        feed={["system prompt", "task + description", "summaries of tasks it depends on", "repo tree", "skills", "recent turns"]}
        tools={["read", "writeFile", "editFile", "delete", "runCommand", "research", "getSkill", "done", "abort"]}
        mcps={["tavily · web search", "context7 · library docs", "apify · scraping"]}
        skills={["project-conventions", "design-system", "dependency-policy", "add-a-route", "ui-base-template", "+3 on demand via getSkill"]}
        footer="≤ 24 iterations · LLM retried 5×, tools 2× · a failed task gets one fresh retry · own git worktree when its level has 2+ tasks"
      />
    ),
    links: [
      src("packages/agents/agent/subAgent.ts", 123),
      src("packages/agents/agent/subagents/coder.ts", 32),
    ],
  },
  uiexpert: {
    tag: "subagent",
    title: "UIExpert",
    body: "Turns one screen's Stitch design into real React code. The design HTML rides along in every call as the reference to match.",
    points: [],
    visual: (
      <AgentLoop
        baml="UIExpertAgent"
        feed={["system prompt", "screen's Stitch design HTML", "task + description", "summaries of tasks it depends on", "repo tree", "skills", "recent turns"]}
        tools={["read", "writeFile", "editFile", "delete", "runCommand", "done", "abort"]}
        mcps={[]}
        skills={["project-conventions", "design-system", "responsive-rules", "ui-base-template"]}
        footer="≤ 14 iterations · same retries as every subagent · no design on disk? it generates one from the UI preferences first"
      />
    ),
    links: [src("packages/agents/agent/subagents/uiExpert.ts", 92)],
  },
  tester: {
    tag: "merge gate · runtime check",
    title: "Tester",
    body: "Not an LLM loop. Once npm run build passes, it starts the app with npm run dev on port 5174 and checks it actually comes up. If it doesn't, the raw output is formatted into a clean error for the Debugger.",
    points: [
      "Polls the dev server every 500ms for up to 60s",
      "ReframeError turns the raw crash output into { error, file, line }",
      "The error is pinned to the task whose files it touched",
      "Uses its own port so the preview on 5173 keeps running",
    ],
    links: [
      src("packages/agents/agent/subagents/tester.ts", 27),
      src("packages/agents/agent/orchestrator.ts", 241),
    ],
  },
  debugger: {
    tag: "merge gate · fix",
    title: "Debugger",
    body: "Gets the build or boot error and fixes it. Then the merge gate re-runs the build and the boot check.",
    points: [],
    visual: (
      <AgentLoop
        baml="DebuggerAgent"
        feed={["system prompt", "errors as file: error", "fix history", "repo tree", "skills", "recent turns"]}
        tools={["read", "writeFile", "editFile", "runCommand", "research", "getSkill", "done", "abort"]}
        mcps={["tavily · web search", "context7 · library docs", "apify · scraping"]}
        skills={["project-conventions", "triage-protocol"]}
        footer="≤ 10 iterations per fix · ≤ 3 merge-gate rounds · stops early if the same error keeps coming back"
      />
    ),
    links: [
      src("packages/agents/agent/orchestrator.ts", 241),
      src("packages/agents/agent/subagents/debugger.ts", 39),
    ],
  },
  llm: {
    tag: "external",
    title: "LLMs via BAML",
    body: "BAML is a small language for LLM calls: each prompt is written as a typed function, and the reply is parsed and validated against that type. Every agent call here is one, running on gpt-5-mini today.",
    points: [],
    visual: (
      <div className="rounded-xl border border-accent/50 bg-background/40 p-4">
        <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-accent uppercase">why I chose BAML</p>
        <ol className="space-y-3 text-sm">
          {(
            [
              ["Model-independent", "Providers are just named clients, so swapping the model is a one-line change and no application code moves."],
              ["One set of types", "BAML classes compile to TypeScript, so the LLM's reply, the agents and the frontend share the same types — the UI renders the exact Question type the LLM must return."],
              ["Prompts tested on their own", "Every system prompt can be run and tweaked in BAML's playground before it ever touches the app."],
              ["Retries built in", "Up to 5 retries with exponential backoff from 1s, capped at 30s — tuned for rate limits."],
            ] as const
          ).map(([title, why], i) => (
            <li key={title} className="flex gap-3">
              <span className="font-mono text-accent">0{i + 1}</span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-muted">{why}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
    links: [
      src("packages/agents/baml_src/agents.baml", 80),
      src("packages/agents/baml_src/agents.baml", 92),
    ],
  },
  sandbox: {
    tag: "runtime · e2b",
    title: "E2B sandbox",
    body: "The generated app lives and runs here. Agents start from a bare React starter — nothing pre-built — so every screen, route and component is written by them. A returning project reconnects to its sandbox by id; a new one boots like this:",
    points: [],
    visual: <SandboxSim />,
    links: [
      src("packages/agents/agent/utils/sandbox.ts", 57),
      src("packages/agents/agent/utils/sandbox.ts", 95),
    ],
  },
  r2: {
    tag: "storage",
    title: "Cloudflare R2",
    body: "The project's durable copy, restored into any new sandbox, so a dead sandbox never loses work. The single agent syncs on every file change; parallel agents sync once per level. Toggle to compare:",
    points: [],
    visual: <R2Sync />,
    links: [
      src("packages/agents/agent/utils/sandbox.ts", 351),
      src("packages/agents/agent/services/file-storage/fileStorage.ts", 52),
    ],
  },
};

// [id, x, y, w, h, title, sub, core]
const NODES: [
  string,
  number,
  number,
  number,
  number,
  string,
  string,
  boolean,
][] = [
  ["browser", 30, 412, 120, 56, "Browser", "React", false],
  [
    "backend",
    200,
    412,
    160,
    56,
    "Backend + queue",
    "GraphQL · BullMQ · worker",
    false,
  ],
  ["stores", 200, 560, 160, 56, "Postgres + Redis", "state · pub/sub", false],
  ["prep", 410, 412, 150, 56, "Preparatory stage", "bootstrap gates", false],
  ["inngest", 610, 412, 124, 56, "Inngest", "simple / complex", false],
  ["langfuse", 610, 560, 124, 56, "Langfuse", "traces · spans", false],
  ["design", 800, 180, 170, 60, "Design pick", "3 Stitch variants", true],
  ["agent", 1060, 180, 170, 60, "Single agent", "one generalist loop", true],
  ["orch", 800, 330, 170, 60, "Orchestrator", "durable steps", true],
  ["dag", 1060, 330, 170, 60, "Planner → DAG", "todos into levels", true],
  ["coder", 850, 528, 170, 56, "Coder", "LLM ⟳ tools", true],
  ["uiexpert", 1120, 528, 170, 56, "UIExpert", "builds from Stitch", true],
  ["tester", 850, 670, 170, 56, "Tester", "boots npm run dev", true],
  ["debugger", 1120, 670, 170, 56, "Debugger", "fix + retry", true],
  ["llm", 1410, 110, 150, 56, "LLMs · BAML", "typed functions", false],
  ["sandbox", 1410, 412, 150, 56, "E2B sandbox", "build · preview", false],
  ["r2", 1410, 600, 150, 56, "Cloudflare R2", "file persistence", false],
];

// [path, label, labelX, labelY, kind]
const EDGES: [string, string, number, number, "flow" | "soft" | "sse"][] = [
  ["M150,440 H196", "", 0, 0, "flow"],
  ["M360,440 H406", "", 0, 0, "flow"],
  ["M280,468 V556", "persist", 288, 518, "soft"],
  ["M560,440 H606", "", 0, 0, "flow"],
  ["M672,468 V556", "traced", 680, 518, "soft"],
  ["M485,412 V362 H90 V408", "pause → ask user", 210, 354, "soft"],
  ["M672,412 V210 H796", "run.simple", 680, 262, "flow"],
  ["M734,440 H760 V360 H796", "run.complex", 766, 414, "flow"],
  ["M970,210 H1056", "", 0, 0, "flow"],
  ["M970,360 H1056", "plan", 994, 352, "flow"],
  ["M1145,390 V440 H935 V524", "", 0, 0, "flow"],
  ["M1145,440 H1205 V524", "", 0, 0, "flow"],
  ["M935,596 V666", "", 0, 0, "flow"],
  ["M1205,596 V666", "", 0, 0, "flow"],
  ["M1020,690 H1116", "error", 1046, 682, "flow"],
  ["M1120,708 H1024", "fixed", 1050, 724, "flow"],
  ["M1320,690 H1334 V360 H1234", "next level", 1250, 352, "soft"],
  ["M1230,210 H1485 V408", "writes to", 1300, 202, "flow"],
  ["M1320,545 H1370 V440 H1406", "writes to", 1344, 432, "flow"],
  ["M1340,138 H1406", "", 0, 0, "soft"],
  ["M1470,468 V596", "sync", 1440, 536, "flow"],
  ["M1500,600 V472", "restore", 1508, 536, "soft"],
  [
    "M1040,786 V836 H90 V472",
    "SSE · Redis pub/sub → live events",
    460,
    828,
    "sse",
  ],
];

const LANE = "font-mono text-[10px] tracking-[0.16em] fill-muted-foreground";

// Fixed px canvas on purpose: text tracks browser zoom instead of refitting.
export function ArchitectureMap() {
  const [open, setOpen] = useState<string | null>(null);
  const info = open ? INFO[open] : null;
  // header and diagram animate separately — animating the whole section would also catch the popup overlay
  const headerRef = useReveal<HTMLDivElement>();
  const mapRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <section id="architecture" className="px-6 pt-10 pb-10 sm:px-10">
      <div
        ref={headerRef}
        className="reveal-stagger mx-auto mb-6 max-w-[1400px]"
      >
        <p className="mb-3 flex items-center gap-3 font-mono text-xs tracking-[0.24em] text-accent uppercase">
          <span className="h-px w-8 bg-accent" />
          architecture
        </p>
        <h2 className="font-display text-4xl font-semibold tracking-tight">
          How a prompt becomes a{" "}
          <span className="text-gradient-accent serif-accent pr-1 font-serif font-normal italic">
            running app
          </span>
        </h2>
        <p className="mt-4 flex items-center gap-2.5 font-callout text-lg font-medium tracking-tight">
          <span className="status-dot h-2 w-2 rounded-full bg-accent" />
          Every box is a live demo. Go break something.
        </p>
        <p className="mt-1.5 pl-[18px] font-mono text-xs text-muted">
          crash the Inngest worker · kill the sandbox · watch the DAG sort itself — click any component
        </p>
      </div>

      <div ref={mapRef} className="reveal overflow-x-auto pb-2">
        <svg
          width={1600}
          height={870}
          className="mx-auto block overflow-visible"
          role="img"
          aria-label="System architecture map"
        >
          <defs>
            {/* canvas-wide gradient: a bbox-relative one renders nothing on perfectly straight paths */}
            <linearGradient
              id="arch-grad"
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={1600}
              y2={0}
            >
              <stop
                offset={0}
                style={{ stopColor: "var(--color-accent-from)" }}
              />
              <stop
                offset={1}
                style={{ stopColor: "var(--color-accent-to)" }}
              />
            </linearGradient>
            {(["flow", "sse"] as const).map((k) => (
              <marker
                key={k}
                id={`arch-ah-${k}`}
                markerWidth={8}
                markerHeight={8}
                refX={6}
                refY={4}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d="M0,0 L8,4 L0,8 Z"
                  style={{
                    fill:
                      k === "sse"
                        ? "var(--color-accent-from)"
                        : "var(--color-accent)",
                  }}
                />
              </marker>
            ))}
          </defs>

          {/* agentic core: centre of the map, everything else feeds it or serves it */}
          <rect
            x={760}
            y={96}
            width={580}
            height={690}
            rx={22}
            fill="url(#arch-grad)"
            fillOpacity={0.035}
            stroke="url(#arch-grad)"
            strokeOpacity={0.55}
            strokeWidth={1.2}
          />
          <text
            x={784}
            y={126}
            className="fill-accent font-mono text-[12px] font-semibold tracking-[0.2em]"
          >
            AGENTIC CORE
          </text>
          <text x={784} y={160} className={LANE}>
            SIMPLE PATH
          </text>
          <line
            x1={780}
            y1={280}
            x2={1320}
            y2={280}
            className="stroke-border-hover"
            strokeDasharray="4 6"
          />
          <text x={784} y={312} className={LANE}>
            COMPLEX PATH
          </text>
          <rect
            x={820}
            y={494}
            width={500}
            height={102}
            rx={14}
            fill="none"
            stroke="url(#arch-grad)"
            strokeOpacity={0.5}
            strokeWidth={1.1}
          />
          <text x={950} y={514} className={LANE}>
            PARALLEL WORKTREES
          </text>
          <rect
            x={820}
            y={630}
            width={500}
            height={128}
            rx={14}
            fill="none"
            stroke="url(#arch-grad)"
            strokeOpacity={0.5}
            strokeWidth={1.1}
          />
          <text x={950} y={650} className={LANE}>
            MERGE GATE · ≤ 3
          </text>
          {/* the same self-healing chip as the hero, right where it actually happens */}
          <foreignObject x={820} y={728} width={500} height={28}>
            <div className="flex justify-center">
              <RetryChip className="py-0.5 text-[10px]" />
            </div>
          </foreignObject>

          {/* arrows are the only thing always lit — they show the request moving */}
          {EDGES.map(([d, label, lx, ly, kind]) => {
            const color =
              kind === "sse"
                ? "var(--color-accent-from)"
                : "var(--color-accent)";
            return (
              <g key={d}>
                <path
                  d={d}
                  fill="none"
                  stroke={kind === "sse" ? color : "url(#arch-grad)"}
                  strokeWidth={1.8}
                  strokeDasharray="7 7"
                  markerEnd={`url(#arch-ah-${kind === "sse" ? "sse" : "flow"})`}
                  className="arch-flow"
                  style={{
                    opacity: kind === "soft" ? 0.6 : 1,
                    animationDuration: kind === "sse" ? "1.6s" : undefined,
                    filter: `drop-shadow(0 0 4px color-mix(in srgb, ${color} 55%, transparent))`,
                  }}
                />
                {label && (
                  <text
                    x={lx}
                    y={ly}
                    className="font-mono text-[11px] font-medium"
                    style={{ fill: color }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {NODES.map(([id, x, y, w, h, title, sub, core]) => (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={title}
              onClick={() => setOpen(id)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                (e.preventDefault(), setOpen(id))
              }
              className="group cursor-pointer outline-none transition-[translate] duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={12}
                strokeWidth={1.2}
                className={cn(
                  "transition-[stroke,filter] duration-200",
                  core
                    ? "fill-[#111119] stroke-[#34344a]"
                    : "fill-surface stroke-border-hover",
                  // glow on hover/focus/open only, in whichever accent is active
                  "group-hover:stroke-accent group-hover:[filter:drop-shadow(0_0_12px_color-mix(in_srgb,var(--color-accent)_55%,transparent))]",
                  "group-focus-visible:stroke-accent group-focus-visible:[filter:drop-shadow(0_0_12px_color-mix(in_srgb,var(--color-accent)_55%,transparent))]",
                  open === id &&
                    "stroke-accent [filter:drop-shadow(0_0_12px_color-mix(in_srgb,var(--color-accent)_55%,transparent))]",
                )}
              />
              <text
                x={x + 16}
                y={y + 25}
                className="pointer-events-none fill-foreground font-display text-[15px] font-semibold"
              >
                {title}
              </text>
              <text
                x={x + 16}
                y={y + 43}
                className="pointer-events-none fill-muted text-[11px]"
              >
                {sub}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex justify-center gap-7 font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <i className="w-8 border-t-2 border-dashed border-accent" />
          request flow
        </span>
        <span className="flex items-center gap-2">
          <i
            className="w-8 border-t-2 border-dashed"
            style={{ borderColor: "var(--color-accent-from)" }}
          />
          live events back to the browser
        </span>
      </div>

      {/* click → a centred popup on the same page, not a new route */}
      <div
        onClick={() => setOpen(null)}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 transition-opacity duration-200",
          info ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-hidden={!info}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-border-hover bg-surface p-7 shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] transition-transform duration-200",
            info ? "scale-100" : "scale-95",
            info?.visual ? "max-w-xl" : "max-w-lg",
          )}
        >
          {info && (
            <>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-border-hover text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">
                {info.tag}
              </p>
              <h3 className="mt-2 mb-3 font-display text-2xl font-semibold tracking-tight">
                {info.title}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                {info.body}
              </p>
              {info.visual && <div className="mb-5">{info.visual}</div>}
              {info.pointsTitle && (
                <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-accent uppercase">
                  {info.pointsTitle}
                </p>
              )}
              {info.points.length > 0 && (
                <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm text-muted">
                  {info.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                {info.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border-hover px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
                  >
                    ↗ {l.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
