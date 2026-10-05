import type { GraphQLContext } from "../context";
import { loadViewableRunById } from "../authz";
import { redis } from "../../lib/redis";
import { logger } from "../../lib/utils";

const TERMINAL = new Set([
  "run_completed",
  "run_failed",
  "clarification_needed",
  "select_design",
  "ui_preference_needed",
]);

const NOT_REPLAYED = ["clarification_needed", "select_design", "ui_preference_needed"];


async function* streamRunEvents(run: { id: string; status: string }, ctx: GraphQLContext) {
  const past = await ctx.prisma.runEvent.findMany({
    where: { runId: run.id, type: { notIn: NOT_REPLAYED } },
    orderBy: { createdAt: "asc" },
  });
  for (const event of past) {
    if (event.content) yield { runEvents: JSON.parse(event.content) };
  }

  if (run.status !== "IN_PROGRESS") return;

  const subscriber = redis.duplicate();
  const pending: string[] = [];
  let notify: (() => void) | null = null;

  const onMessage = (_channel: string, message: string) => {
    pending.push(message);
    notify?.();
    notify = null;
  };

  subscriber.on("message", onMessage);
  subscriber.on("error", (err) =>
    logger.error(`Redis subscriber error for run ${run.id}: ${err}`),
  );
  await subscriber.subscribe(`run:${run.id}`);

  try {
    for (;;) {
      if (pending.length === 0) {
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
      }

      while (pending.length > 0) {
        const raw = pending.shift()!;
        let event: { type?: string };
        try {
          event = JSON.parse(raw);
        } catch (e) {
          logger.error(`Failed to parse event for run ${run.id}: ${e}`);
          continue;
        }

        yield { runEvents: event };

        if (event.type && TERMINAL.has(event.type)) return;
      }
    }
  } finally {
    subscriber.off("message", onMessage);
    await subscriber.unsubscribe(`run:${run.id}`).catch(() => {});
    subscriber.disconnect();
  }
}

export const streamResolvers = {
  Subscription: {
    runEvents: {
      subscribe: async (
        _parent: unknown,
        args: { runId: string },
        ctx: GraphQLContext,
      ) => {
        const run = await loadViewableRunById(ctx, args.runId);
        return streamRunEvents(run, ctx);
      },
    },
  },
};
