// apps/backend/src/telemetry/langfuse.ts
import "dotenv/config"
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

const langfuseProcessor = new LangfuseSpanProcessor({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

export const sdk = new NodeSDK({ spanProcessors: [langfuseProcessor] });
sdk.start();

export const flushTraces = () => langfuseProcessor.forceFlush();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await sdk.shutdown().catch(() => {});
    process.exit(0);
  });
}