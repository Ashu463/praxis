import { useEffect, useState } from "react";

const AGENTS = ["Coder Agent", "Designer Agent", "Debugger Agent"];

// Types each agent name, holds, deletes, moves to the next — in the wordmark's gradient.
export function AgentTyper() {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [i, setI] = useState(0);
  const [len, setLen] = useState(reduced ? AGENTS[0]!.length : 0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const word = AGENTS[i]!;
    let delay = deleting ? 35 : 75;
    if (!deleting && len === word.length) delay = 1600;
    const id = setTimeout(() => {
      if (!deleting && len === word.length) setDeleting(true);
      else if (deleting && len === 0) {
        setDeleting(false);
        setI((n) => (n + 1) % AGENTS.length);
      } else setLen((n) => n + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [i, len, deleting, reduced]);

  return (
    <span aria-label={AGENTS.join(", ")}>
      <span className="text-gradient-accent">{AGENTS[i]!.slice(0, len)}</span>
      <span aria-hidden className="console-caret ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] bg-accent" />
    </span>
  );
}
