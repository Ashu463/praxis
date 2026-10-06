import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Job = { id: number; slot: number | null; progress: number };
type Sim = { jobs: Job[]; nextId: number; done: number };

const SLOTS = 5; // concurrency: 5 in apps/backend/src/lib/worker.ts
const MAX_WAITING = 6;
const CHIP = 56; // px per waiting chip, gap included

// Toy BullMQ run: createRun pushes jobs into Redis, they slide up the wait list, the worker takes the oldest into a free slot.
export function QueueSim() {
  const [sim, setSim] = useState<Sim>({
    jobs: [1, 2, 3].map((id) => ({ id, slot: null, progress: 0 })),
    nextId: 4,
    done: 0,
  });

  useEffect(() => {
    const t = setInterval(
      () =>
        setSim(({ jobs, nextId, done }) => {
          let finished = 0;
          let next = jobs.flatMap((j) => {
            if (j.slot === null) return [j];
            const progress = j.progress + 6 + Math.random() * 10;
            if (progress >= 100) return (finished++, []);
            return [{ ...j, progress }];
          });

          // arrivals outpace the worker, so a backlog builds up in Redis
          if (next.filter((j) => j.slot === null).length < MAX_WAITING && Math.random() < 0.7) {
            next.push({ id: nextId++, slot: null, progress: 0 });
          }

          // FIFO: every free slot takes the head of the wait list
          const used = new Set(next.map((j) => j.slot));
          for (let s = 0; s < SLOTS; s++) {
            if (used.has(s)) continue;
            const head = next.find((j) => j.slot === null);
            if (!head) break;
            next = next.map((j) => (j === head ? { ...j, slot: s } : j));
          }

          return { jobs: next, nextId, done: done + finished };
        }),
      650,
    );
    return () => clearInterval(t);
  }, []);

  const waiting = sim.jobs.filter((j) => j.slot === null);

  return (
    <div className="rounded-xl border border-border-hover bg-background/40 p-4 font-mono text-[11px] text-muted">
      <div className="mb-1.5 flex justify-between">
        <span>createRun → queue.add()</span>
        <span className="text-accent">redis · bull:run-agent:wait</span>
      </div>
      <div
        className="relative h-9 overflow-hidden rounded-lg border border-dashed border-border-hover"
        style={{ width: MAX_WAITING * CHIP + 8 }}
      >
        {/* index 0 is the head, pinned to the right edge nearest the worker */}
        {waiting.map((j, i) => (
          <span
            key={j.id}
            className="absolute top-1.5 flex h-6 w-12 items-center justify-center rounded-md border border-border-hover bg-surface text-foreground transition-[right] duration-500"
            style={{ right: 4 + i * CHIP, animation: "queue-in 0.4s ease-out" }}
          >
            #{j.id}
          </span>
        ))}
      </div>

      <p className="my-2 pl-1">↓ worker pulls the oldest job when a slot frees up</p>

      <div className="mb-1.5 flex justify-between">
        <span>bull worker · concurrency {SLOTS}</span>
        <span className="text-accent">bull:run-agent:active</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: SLOTS }, (_, s) => {
          const job = sim.jobs.find((j) => j.slot === s);
          return (
            <div
              key={s}
              className={cn(
                "h-12 rounded-lg border p-1.5 transition-colors",
                job ? "border-accent/60 bg-surface" : "border-border-hover",
              )}
            >
              <div className={job ? "text-foreground" : "opacity-50"}>
                {job ? `#${job.id}` : "idle"}
              </div>
              {job && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border-hover">
                  <div
                    className="h-full bg-accent transition-[width] duration-500"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-right">
        completed <span className="text-accent">{sim.done}</span> → handed to Inngest
      </p>
    </div>
  );
}
