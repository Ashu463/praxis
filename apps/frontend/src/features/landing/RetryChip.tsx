import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// The self-healing loop in one chip: fail → retry → pass, forever.
const STATES = [
  { glyph: "✗", agent: "tester", text: "2 type errors in App.tsx", tone: "text-danger border-danger/40 bg-danger/10" },
  { glyph: "↻", agent: "debugger", text: "patching · retry 2/3", tone: "text-warn border-warn/40 bg-warn/10" },
  { glyph: "✓", agent: "tester", text: "build passed", tone: "text-ok border-ok/40 bg-ok/10" },
];

export function RetryChip({ className }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % STATES.length), 1900);
    return () => clearInterval(id);
  }, []);

  const s = STATES[i]!;
  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors duration-500",
        s.tone,
        className,
      )}
    >
      <span key={i} className={cn("inline-block", s.glyph === "↻" && "animate-spin [animation-duration:1.4s]")}>
        {s.glyph}
      </span>
      <span className="text-foreground/80">{s.agent}:</span>
      {s.text}
    </span>
  );
}
