import { b } from "../../baml_client"
import { SUBAGENT_SUMMARY_PROMPT } from "../config/systemPrompts"
import { logger } from "./logger"
import { observeBaml } from "./tracing"

// This guy is responsible for generating lastRUnNarrativeSource of that context loading at the time of init of callAgent.
export async function summarizeIncompleteSession(sessionSnapshotJson: string): Promise<string | null> {
    try {
        const summary = await observeBaml(
            "GenerateSubagentSummary",
            { entries: sessionSnapshotJson.length },
            (opts) => b.GenerateSubagentSummary(SUBAGENT_SUMMARY_PROMPT, "unknown (resumed after a stalled/crashed run)", sessionSnapshotJson, opts),
        )
        return summary
    } catch (e) {
        logger.error(`summarizeIncompleteSession failed: ${e instanceof Error ? e.message : String(e)}`)
        return null
    }
}
