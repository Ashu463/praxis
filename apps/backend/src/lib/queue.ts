import { Queue } from "bullmq";
import { redis } from "./redis";

export const runQueue = new Queue("run-agent", { connection: redis });
