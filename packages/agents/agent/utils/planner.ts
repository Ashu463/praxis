import { b } from "../../baml_client"
import type { PlannerTodo, PlannedScreen } from "../../baml_client"
import { ENUMERATE_SCREENS_PROMPT, PLAN_TASKS_PROMPT } from "../config/systemPrompts"
import { backendGql } from "./backendClient"
import { createRunEmitter, type EventEmitter } from "../events"
import { startActiveObservation, startObservation } from "@langfuse/tracing"
import { observeBaml, runSpanContext } from "./tracing"
import { generateScreenHtml, extractTailwindConfig } from "../tools/stitch"
import { designRefPath } from "./designPath"
import { E2BSandbox } from "./sandbox"
import { PROJECT_ROOT, STITCH_DESIGN_CONCURRENCY, STITCH_DESIGN_RETRY_ATTEMPTS, STITCH_DESIGN_BACKOFF_MS } from "../config/systemConfig"
import { logger } from "./logger"

export type DesignResult = { screenId: string, status: 'generated' | 'reused' | 'degraded', reason?: string }

export class Planner {
    private emitter: EventEmitter
    constructor(
        private userId: string,
        private projectId: string,
        private runId: string,
    ) {
        this.emitter = createRunEmitter(runId)
    }

    async enumerateScreens(request: string, context: string): Promise<PlannedScreen[]> {
        return startActiveObservation(
            "enumerate-screens",
            async (span): Promise<PlannedScreen[]> => {
                span.update({ input: { request } })
                const screens = await observeBaml(
                    "EnumerateScreens",
                    { request },
                    (opts) => b.EnumerateScreens(ENUMERATE_SCREENS_PROMPT, request, context, opts),
                )
                span.update({ output: screens })
                return screens
            },
            { parentSpanContext: await runSpanContext(this.runId) },
        )
    }

    async planTasks(request: string, context: string, screens: PlannedScreen[]): Promise<PlannerTodo[]> {
        return startActiveObservation(
            "plan-tasks",
            async (span): Promise<PlannerTodo[]> => {
                span.update({ input: { request, screens: screens.length } })
                const { reasoning, todos } = await observeBaml(
                    "PlanTasks",
                    { request, screens: screens.length },
                    (opts) => b.PlanTasks(PLAN_TASKS_PROMPT, request, context, screens, opts),
                )
                span.update({ output: todos, metadata: { reasoning } })
                await this.saveTodos(todos)
                return todos
            },
            { parentSpanContext: await runSpanContext(this.runId) },
        )
    }

    private async saveTodos(todos: PlannerTodo[]): Promise<void> {
        const input = todos.map(({ id, task, agent, status, dependency }) => ({ id, task, agent, status, dependency }))
        await backendGql(
            `mutation SaveTodos($projectId: ID!, $runId: ID!, $todos: [PlannedTodoInput!]!) {
                saveTodos(projectId: $projectId, runId: $runId, todos: $todos) { id taskId }
            }`,
            { projectId: this.projectId, runId: this.runId, todos: input },
        ).catch(e => logger.error(`Failed to save todos for run ${this.runId}: ${e}`))
    }

    async generateDesigns(screens: PlannedScreen[], sandbox: E2BSandbox): Promise<DesignResult[]> {
        return startActiveObservation(
            "generate-designs",
            async (span): Promise<DesignResult[]> => {
                span.update({ input: { screens: screens.length } })
                await this.emitter.emit({ type: 'design_progress', message: `Designing ${screens.length} screen${screens.length === 1 ? '' : 's'}…` })
                const results: DesignResult[] = []

                let capturedConfig: string | null = null

                for (let i = 0; i < screens.length; i += STITCH_DESIGN_CONCURRENCY) {
                    const chunk = screens.slice(i, i + STITCH_DESIGN_CONCURRENCY)
                    const chunkResults = await Promise.all(chunk.map((screen) =>
                        startActiveObservation(`design-${screen.id}`, async (s): Promise<DesignResult> => {
                            s.update({ input: { screenId: screen.id, name: screen.name } })
                            const path = designRefPath(screen.id)

                            const existing = await sandbox.Execute(sandbox.sandboxId, { action: 'read', path }, PROJECT_ROOT).catch(() => null)
                            if (existing?.success && existing.content.length > 0) {
                                s.update({ output: { status: 'reused' } })
                                return { screenId: screen.id, status: 'reused' }
                            }

                            for (let attempt = 1; attempt <= STITCH_DESIGN_RETRY_ATTEMPTS; attempt++) {
                                try {
                                    const html = await generateScreenHtml(screen.designBrief, this.userId)
                                    if (!capturedConfig) {
                                        const extracted = extractTailwindConfig(html)
                                        if (extracted) capturedConfig = extracted
                                    }
                                    const writeRes = await sandbox.Execute(sandbox.sandboxId, { action: 'writeFile', path, content: html }, PROJECT_ROOT)
                                    if (!writeRes.success) throw new Error(`design write failed: ${writeRes.content}`)
                                    s.update({ output: { status: 'generated' } })
                                    await this.emitter.emit({ type: 'design_progress', message: `Designed the ${screen.name} screen` })
                                    return { screenId: screen.id, status: 'generated' }
                                } catch (e) {
                                    logger.warn(`Stitch design for screen ${screen.id} failed (attempt ${attempt}/${STITCH_DESIGN_RETRY_ATTEMPTS}): ${e instanceof Error ? e.message : String(e)}`)
                                    if (attempt < STITCH_DESIGN_RETRY_ATTEMPTS) {
                                        await new Promise((r) => setTimeout(r, STITCH_DESIGN_BACKOFF_MS * attempt))
                                    }
                                }
                            }

                            const reason = `Stitch failed to design screen ${screen.id} after ${STITCH_DESIGN_RETRY_ATTEMPTS} attempts`
                            logger.error(reason)
                            startObservation("design-degraded", { input: { screenId: screen.id } }, { asType: "event" }).end()
                            s.update({ level: "ERROR", statusMessage: reason })
                            return { screenId: screen.id, status: 'degraded', reason }
                        })))
                    results.push(...chunkResults)
                }

                if (results.some((r) => r.status === 'generated')) {
                    if (capturedConfig) {
                        await this.injectTailwindConfig(sandbox, capturedConfig)
                    }
                    await sandbox.SyncR2().catch((e) => logger.error(`Failed to sync designs to R2: ${e}`))
                    startObservation("designs-synced", { input: { count: results.filter((r) => r.status === 'generated').length } }, { asType: "event" }).end()
                }

                span.update({ output: {
                    generated: results.filter((r) => r.status === 'generated').length,
                    reused: results.filter((r) => r.status === 'reused').length,
                    degraded: results.filter((r) => r.status === 'degraded').length,
                } })
                return results
            },
            { parentSpanContext: await runSpanContext(this.runId) },
        )
    }

    // Writes the harvested config into the project's real index.html, right
    // after the Tailwind CDN script tag (config must load after the CDN
    // script defines `tailwind`, or the assignment has nothing to attach to).
    // Idempotent — a project that already has one (this run's earlier screen,
    // or a prior run) is left alone rather than overwritten.
    private async injectTailwindConfig(sandbox: E2BSandbox, config: string): Promise<void> {
        const indexPath = 'index.html'
        const current = await sandbox.Execute(sandbox.sandboxId, { action: 'read', path: indexPath }, PROJECT_ROOT)
        if (!current.success) {
            logger.error(`Failed to read index.html to inject Tailwind config: ${current.content}`)
            return
        }
        if (current.content.includes('id="tailwind-config"') || current.content.includes("id='tailwind-config'")) {
            return
        }

        const scriptTag = `<script id="tailwind-config">\n    ${config}\n  </script>`
        const cdnMarker = /<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/i
        const updated = cdnMarker.test(current.content)
            ? current.content.replace(cdnMarker, (m) => `${m}\n    ${scriptTag}`)
            : current.content.replace('</head>', `    ${scriptTag}\n  </head>`)

        const writeRes = await sandbox.Execute(sandbox.sandboxId, { action: 'writeFile', path: indexPath, content: updated }, PROJECT_ROOT)
        if (!writeRes.success) {
            logger.error(`Failed to write index.html with injected Tailwind config: ${writeRes.content}`)
            return
        }
        logger.info('Injected harvested Tailwind config into index.html')
    }
}
