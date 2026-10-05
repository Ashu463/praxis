import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";
import { RetryChip } from "@/features/landing/RetryChip";

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
};

// Every line below is taken from the code it links to — keep it that way when editing.
const INFO: Record<string, Info> = {
  browser: {
    tag: "client · react",
    title: "Browser",
    body: "A React app whose RunProvider mirrors the run's lifecycle as a state machine: idle, submitting, running, clarification_needed, select_design, ui_preference_needed, completed, conversation, failed.",
    points: [
      "Live events arrive over GraphQL subscriptions using graphql-sse, which posts the query so it can carry an Authorization header — the reason it's SSE, not WebSockets",
      "Reopening a run after a refresh rebuilds its state from the runState query",
    ],
    links: [
      src("apps/frontend/src/lib/run.tsx", 99),
      src("apps/frontend/src/lib/gqlStream.ts", 14),
    ],
  },
  backend: {
    tag: "backend · :3000",
    title: "Backend + job queue",
    body: "An Express server with Apollo Server on /graphql for queries and mutations, graphql-sse on /graphql/stream for subscriptions, and Bull Board on /admin/queues.",
    points: [
      'createRun writes a Run row and enqueues a job on the BullMQ queue "run-agent"; continueRun re-enqueues the same runId after a pause',
      "The API process never imports the agent code — a separate worker process consumes the queue with concurrency 5 and a 300s job lock",
      "The worker starts or reconnects the E2B sandbox before handing the run to CallAgent",
    ],
    links: [
      src("apps/backend/src/graphql/server.ts", 16),
      src("apps/backend/src/graphql/modules/chat.ts", 96),
      src("apps/backend/src/lib/worker.ts", 29),
    ],
  },
  stores: {
    tag: "state",
    title: "Postgres + Redis",
    body: "Postgres (via Prisma) stores users, projects, runs, todos, task summaries, designs, clarification and UI-preference Q&A, run events and access requests. Redis backs the BullMQ queue and a pub/sub channel per run.",
    points: [
      "Run status transitions are driven by events through one map: clarification_needed, select_design, ui_preference_needed, run_completed, run_failed",
      "Every event is also stored as a RunEvent row, so a reconnecting browser can replay the history",
    ],
    links: [
      src("apps/backend/prisma/schema.prisma", 51),
      src("apps/backend/src/graphql/modules/internal.ts", 9),
    ],
  },
  prep: {
    tag: "preparatory stage · CallAgent",
    title: "Bootstrap gates",
    body: "Everything that might need to ask the user something runs here, before any build work is dispatched.",
    points: [
      "Dev gate: CheckIsDevelopmentRequest — a conversational message gets a direct reply and never reaches the build pipeline",
      "One GraphQL query loads saved questions, answers, designs, the cached complexity verdict and UI preferences",
      "Unanswered questions pause the run; stored answers are folded into the prompt",
      "CheckComplexity (cached on the project) and GenerateClarifyingQuestions decide the path",
      "Complex path asks project-wide UI preference questions; simple path generates 3 Stitch design variants to pick from",
      "Any pause flips the run to CLARIFICATION_NEEDED, AWAITING_DESIGN_SELECTION or AWAITING_UI_PREFERENCE and ends the job",
    ],
    links: [
      src("packages/agents/agent/callAgent.ts", 56),
      src("packages/agents/agent/callAgent.ts", 291),
    ],
  },
  inngest: {
    tag: "durable engine · :8288",
    title: "Inngest trigger",
    body: "Once every gate passes, CallAgent sends callAgent/run.complex or callAgent/run.simple and the BullMQ job ends. Inngest calls back into the worker on :3001/api/inngest to run the build.",
    points: [
      "Two functions: run-complex-task (Orchestrator) and run-simple-task (single Agent)",
      "Each phase is a step.run checkpoint, so after a crash a completed step returns its saved result instead of re-running",
      "A crash emits run_failed as its own step, then rethrows",
    ],
    links: [
      src("packages/agents/agent/callAgent.ts", 441),
      src("packages/agents/agent/callAgent.ts", 533),
    ],
  },
  design: {
    tag: "simple path · design",
    title: "Design pick · Stitch",
    body: "For a simple request, UIExpert frames 3 design-variant prompts (FramePrompts) and generates each as a Stitch screen. The run pauses on select_design until the user picks one.",
    points: [
      "This happens in the preparatory stage, before run.simple is sent",
      "The chosen design's HTML is what the single agent builds on",
    ],
    links: [src("packages/agents/agent/subagents/uiExpert.ts", 55)],
  },
  agent: {
    tag: "simple path · run-simple-task",
    title: "Single agent",
    body: "One generalist agent (AgentLLMCall) builds the whole app on top of the picked design, inside a single Inngest step.",
    points: [
      "Capped at 25 iterations; each LLM call retries up to 5 times",
      "Compacts its context with CompactContext / SummarizeContext as it grows",
      "Syncs every file write and delete to R2 as it goes",
      "Ends with GenerateAgentSummary, then finalizeRun publishes the preview",
    ],
    links: [
      src("packages/agents/agent/agent.ts", 81),
      src("packages/agents/agent/callAgent.ts", 558),
    ],
  },
  orch: {
    tag: "complex path · run-complex-task",
    title: "Orchestrator",
    body: "Plans the app, then walks the DAG level by level. Every level runs as Inngest steps: spawn, merge gate, sync to R2, commit state, decide.",
    points: [
      "A level fails the run if any task still fails after 2 attempts",
      "The decide step is a stub today — it always continues; replan and abort aren't implemented yet",
      "Finishes with CallAgentSummary, then finalizeRun: preview URL, run summary, project name, run_completed",
    ],
    links: [
      src("packages/agents/agent/orchestrator.ts", 340),
      src("packages/agents/agent/orchestrator.ts", 124),
    ],
  },
  dag: {
    tag: "complex path · planner",
    title: "Planner → DAG",
    body: "A two-phase planner: EnumerateScreens lists the screens first, then PlanTasks and the design pre-phase run in parallel. The todos are sorted into levels with a topological sort.",
    points: [
      "Design pre-phase: one Stitch design per screen, 3 at a time, 3 attempts each",
      "A screen whose design keeps failing is marked degraded and built without one — it never sinks the build",
      "Designs already in the sandbox from a prior run are reused, not regenerated",
      "The first screen's Tailwind config becomes the whole app's theme",
    ],
    links: [
      src("packages/agents/agent/utils/planner.ts", 38),
      src("packages/agents/agent/utils/planner.ts", 105),
    ],
  },
  coder: {
    tag: "subagent",
    title: "Coder",
    body: "Writes the app through a tool-calling loop: read, writeFile, editFile, delete, runCommand, research, getSkill, then done or abort.",
    points: [
      "Up to 24 iterations per task",
      "Each LLM call retries up to 5 times, each tool call up to 2 times",
      "A failed task is retried once more with backoff (2 attempts in total)",
      "In a level with 2+ tasks it works in its own git worktree",
    ],
    links: [
      src("packages/agents/agent/subAgent.ts", 123),
      src("packages/agents/agent/subagents/coder.ts", 32),
    ],
  },
  uiexpert: {
    tag: "subagent",
    title: "UIExpert",
    body: "Builds a screen from that screen's pre-generated Stitch design, read from the sandbox. If none exists it generates one inline from the stored UI preferences.",
    points: [
      "Runs UIExpertAgent with the design HTML as its reference",
      "Up to 14 iterations per task, same retry rules as every subagent",
    ],
    links: [src("packages/agents/agent/subagents/uiExpert.ts", 92)],
  },
  tester: {
    tag: "merge gate · runtime check",
    title: "Tester",
    body: "Runs only after npm run build passes. It boots the app with npm run dev on port 5174 and checks it comes up.",
    points: [
      "Uses its own port so it never kills the preview server on 5173",
      "On failure, ReframeError turns the raw output into a file, line and error",
      "The error is attributed to the task whose files it touched",
    ],
    links: [
      src("packages/agents/agent/subagents/tester.ts", 27),
      src("packages/agents/agent/orchestrator.ts", 241),
    ],
  },
  debugger: {
    tag: "merge gate · fix",
    title: "Debugger",
    body: "Gets the build or runtime error and fixes it with read, writeFile, editFile, runCommand, research and getSkill. Then the merge gate re-runs the build and the boot check.",
    points: [
      "Up to 3 debug rounds per level",
      "Stops early if the same error signature keeps coming back",
      "Up to 10 iterations per fix, retried like any subagent",
      "Files are synced to R2 after every round",
    ],
    links: [
      src("packages/agents/agent/orchestrator.ts", 241),
      src("packages/agents/agent/subagents/debugger.ts", 39),
    ],
  },
  llm: {
    tag: "external",
    title: "LLMs via BAML",
    body: "Every agent call is a typed BAML function with a schema-validated response. The functions run on gpt-5-mini.",
    points: [
      "Retry policy: up to 5 retries with exponential backoff from 1s, capped at 30s — tuned for rate limits",
      "Calls are traced to Langfuse",
    ],
    links: [
      src("packages/agents/baml_src/agents.baml", 80),
      src("packages/agents/baml_src/agents.baml", 92),
    ],
  },
  sandbox: {
    tag: "runtime · e2b",
    title: "E2B sandbox",
    body: "The generated app lives and runs here. The worker reconnects to the project's sandbox by id, or creates a fresh one from the react-sandbox-node22 template with a 1-hour timeout.",
    points: [
      "A fresh sandbox restores the project from R2, then runs npm install if node_modules is missing",
      "Concurrent starts for the same project share a single restore",
      "The preview runs on port 5173",
    ],
    links: [
      src("packages/agents/agent/utils/sandbox.ts", 57),
      src("packages/agents/agent/utils/sandbox.ts", 95),
    ],
  },
  r2: {
    tag: "storage",
    title: "Cloudflare R2",
    body: "The project's durable copy, keyed as users/<userId>/projects/<projectId>/files/, so a dead sandbox never loses work.",
    points: [
      "Synced after every DAG level and during merge-gate rounds",
      "Restored into any new sandbox on start",
    ],
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
        <p className="mt-2 text-sm text-muted">
          Click any component to open its story.
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
            "relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-hover bg-surface p-7 shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] transition-transform duration-200",
            info ? "scale-100" : "scale-95",
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
              <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {info.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
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
