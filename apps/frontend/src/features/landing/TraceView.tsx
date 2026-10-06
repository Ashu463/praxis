// What lands in Langfuse and in what shape — names taken from tracing.ts, agent.ts, planner.ts, orchestrator.ts, subAgent.ts, worker.ts, callAgent.ts
const TYPES: [string, string, string, string[]][] = [
  [
    "trace",
    "one per run",
    "id = SHA-256(runId), first 32 hex chars — the BullMQ worker and every Inngest call compute it themselves, so they all land in the same trace",
    ["run <runId>"],
  ],
  [
    "span",
    "a phase with a start and an end",
    "name · input · output · duration",
    [
      "prep",
      "agent-loop",
      "iteration-n",
      "manage-context",
      "enumerate-screens",
      "plan-tasks",
      "generate-designs",
      "design-<screen>",
      "multi-agent-parallel-runner",
      "subagent-<type>-task-<id>",
      "multi-agent-runMergeGate",
      "multi-agent-summarize",
      "web-search",
      "web-scrape",
    ],
  ],
  [
    "generation",
    "every BAML call, via observeBaml",
    "input · output · model · tokens in / out / cached · BAML attempts · duration · ERROR level if it throws",
    [
      "CheckIsDevelopmentRequest",
      "CheckComplexity",
      "EnumerateScreens",
      "PlanTasks",
      "AgentLLMCall",
      "CoderAgent",
      "UIExpertAgent",
      "DebuggerAgent",
      "ReframeError",
      "ResolveMergeConflict",
      "CompactContext",
      "…every other BAML function",
    ],
  ],
  [
    "event",
    "a single moment, no duration",
    "name · input payload",
    [
      "bullmq-retry",
      "inngest-retry",
      "llm-retry",
      "subagent-task-retry",
      "merge-conflict",
      "merge-gate-iteration",
      "design-degraded",
      "loop-break",
      "reused-questions",
      "awaiting-design-selection",
    ],
  ],
];

export function TraceView() {
  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      {TYPES.map(([type, what, format, names], i) => (
        <div key={type} className="flex gap-3">
          {/* tree rail: trace on top, the three observation types hang off it */}
          <div className="flex w-3 flex-col items-center">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
            {i < TYPES.length - 1 && <span className="w-px flex-1 bg-accent/40" />}
          </div>
          <div className="flex-1 pb-4">
            <p>
              <span className="text-sm text-accent">{type}</span>
              <span className="text-foreground"> · {what}</span>
            </p>
            <p className="mt-0.5 mb-1.5">
              <span className="text-muted-foreground">records </span>
              {format}
            </p>
            <div className="flex flex-wrap gap-1">
              {names.map((n) => (
                <span key={n} className="rounded border border-border-hover bg-surface px-1.5 py-0.5 text-foreground">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="text-muted-foreground">
        Built on OpenTelemetry · flushed after every Inngest request, since each one is a short HTTP call.
      </p>
    </div>
  );
}
