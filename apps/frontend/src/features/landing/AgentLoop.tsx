import { useId } from "react";

export type AgentLoopProps = {
  baml: string;
  feed: string[];
  tools: string[];
  mcps: string[];
  skills: string[];
  footer: string;
};

const BOX = "fill-[#111119] stroke-border-hover";

// The loop every agent runs: LLM call → feed the result back into context → execute the chosen tool → call the LLM again.
export function AgentLoop({ baml, feed, tools, mcps, skills, footer }: AgentLoopProps) {
  const marker = `loop-ah-${useId().replace(/:/g, "")}`;
  const arrow = {
    fill: "none",
    strokeWidth: 1.6,
    strokeDasharray: "6 6",
    markerEnd: `url(#${marker})`,
    className: "arch-flow",
    style: { stroke: "var(--color-accent)" },
  };

  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-3">
      <svg viewBox="0 0 500 236" className="block w-full" role="img" aria-label={`${baml} agent loop`}>
        <defs>
          <marker id={marker} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" style={{ fill: "var(--color-accent)" }} />
          </marker>
        </defs>

        {/* staircase down, then one long arrow back up: the shape of the loop */}
        <path d="M120,58 V84" {...arrow} />
        <path d="M170,134 V160" {...arrow} />
        <path d="M220,210 C220,232 40,236 40,180 V62" {...arrow} />
        <text x={46} y={150} className="font-mono text-[10px]" style={{ fill: "var(--color-accent)" }}>
          next iteration
        </text>

        <rect x={30} y={8} width={180} height={50} rx={10} strokeWidth={1.2} className={BOX} style={{ stroke: "var(--color-accent)" }} />
        <text x={120} y={30} textAnchor="middle" className="fill-foreground font-display text-[12px] font-semibold">
          LLM call
        </text>
        <text x={120} y={46} textAnchor="middle" className="fill-muted font-mono text-[9px]">
          {baml}
        </text>

        <rect x={80} y={88} width={180} height={46} rx={10} strokeWidth={1.2} className={BOX} />
        <text x={170} y={115} textAnchor="middle" className="fill-foreground font-display text-[12px] font-semibold">
          context feed
        </text>
        <path d="M260,111 H272" fill="none" strokeWidth={1.2} strokeDasharray="3 3" style={{ stroke: "var(--color-accent)" }} />
        <foreignObject x={276} y={72} width={224} height={80}>
          <div className="flex h-full flex-wrap content-center gap-1 rounded-lg border border-border-hover p-1.5 font-mono text-[9px] leading-tight text-muted">
            {feed.map((f) => (
              <span key={f} className="rounded border border-border-hover bg-surface px-1 py-0.5">
                {f}
              </span>
            ))}
          </div>
        </foreignObject>

        <rect x={130} y={164} width={180} height={46} rx={10} strokeWidth={1.2} className={BOX} />
        <text x={220} y={191} textAnchor="middle" className="fill-foreground font-display text-[12px] font-semibold">
          tool execution
        </text>
      </svg>

      <div className="mt-3 space-y-2 font-mono text-[10px]">
        {(
          [
            ["tools", tools],
            ["MCPs", mcps],
            ["skills", skills],
          ] as const
        ).map(([name, items]) => (
          <div key={name} className="flex gap-2">
            <span className="w-12 shrink-0 pt-0.5 text-accent">{name}</span>
            <div className="flex flex-wrap gap-1">
              {items.length === 0 ? (
                <span className="pt-0.5 text-muted-foreground">none</span>
              ) : (
                items.map((t) => (
                  <span key={t} className="rounded border border-border-hover bg-surface px-1.5 py-0.5 text-foreground">
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
        <p className="pt-1 text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
