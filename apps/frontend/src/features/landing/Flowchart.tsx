import { useId } from "react";
import { cn } from "@/lib/utils";

// gate = a decision, pause = the run stops and waits for the user, llm = a BAML call
export type FlowKind = "step" | "gate" | "pause" | "end" | "llm";
// [x, y, w, h, title, sub, kind]
export type FlowNode = [number, number, number, number, string, string, FlowKind];
// [path, label, labelX, labelY]
export type FlowEdge = [string, string, number, number];

const LEGEND: Partial<Record<FlowKind, string>> = {
  gate: "gate",
  llm: "LLM call",
  pause: "run pauses for the user",
};

const STROKE: Partial<Record<FlowKind, string>> = {
  gate: "var(--color-accent)",
  llm: "var(--color-accent-to)",
  pause: "var(--color-accent-from)",
};

// Shared look for every flowchart in the architecture popups: dark cards, accent gates, animated dashed arrows.
export function Flowchart({
  nodes,
  edges,
  height,
  label,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  height: number;
  label: string;
}) {
  // two charts can be on screen while the popup fades, so marker ids must be unique
  const marker = `flow-ah-${useId().replace(/:/g, "")}`;
  const kinds = new Set(nodes.map((n) => n[6]));

  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-3">
      <svg viewBox={`0 0 500 ${height}`} className="block w-full" role="img" aria-label={label}>
        <defs>
          <marker id={marker} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" style={{ fill: "var(--color-accent)" }} />
          </marker>
        </defs>

        {edges.map(([d, text, lx, ly]) => (
          <g key={d}>
            <path
              d={d}
              fill="none"
              strokeWidth={1.6}
              strokeDasharray="6 6"
              markerEnd={`url(#${marker})`}
              className="arch-flow"
              style={{ stroke: "var(--color-accent)" }}
            />
            {text && (
              <text x={lx} y={ly} className="font-mono text-[10px]" style={{ fill: "var(--color-accent)" }}>
                {text}
              </text>
            )}
          </g>
        ))}

        {nodes.map(([x, y, w, h, title, sub, kind]) => (
          <g key={`${title}-${x}-${y}`}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={10}
              strokeWidth={1.2}
              strokeDasharray={kind === "pause" ? "4 4" : undefined}
              className={cn(kind === "step" || kind === "pause" ? "fill-surface" : "fill-[#111119]", "stroke-border-hover")}
              style={STROKE[kind] ? { stroke: STROKE[kind] } : undefined}
            />
            <text
              x={x + w / 2}
              y={sub ? y + h / 2 - 3 : y + h / 2 + 4}
              textAnchor="middle"
              className="fill-foreground font-display text-[12px] font-semibold"
            >
              {title}
            </text>
            {sub && (
              <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" className="fill-muted font-mono text-[9px]">
                {sub}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="mt-2 flex justify-center gap-5 font-mono text-[10px] text-muted-foreground">
        {(Object.keys(LEGEND) as FlowKind[])
          .filter((k) => kinds.has(k))
          .map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i
                className={cn("h-2.5 w-4 rounded-sm border", k === "pause" && "border-dashed")}
                style={{ borderColor: STROKE[k] }}
              />
              {LEGEND[k]}
            </span>
          ))}
      </div>
    </div>
  );
}
