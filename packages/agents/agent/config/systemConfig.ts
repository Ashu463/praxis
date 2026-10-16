export const PORT = 3000
export const SANDBOX_HOME = '/home/user'
export const PROJECT_ROOT = `${SANDBOX_HOME}/app`
export const MAX_BOOT_WAIT_MS = 60000
export const POLL_INTERVAL_MS = 500
// for boot loader, right after successful building of the app
export const PREVIEW_PORT = 5173
// for tester, to avoid port conflict. 
export const TESTER_PREVIEW_PORT = 5174

export const PREVIEW_START_ATTEMPTS = 2
export const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:3000`
export const REDIS_HOST = process.env.REDIS_HOST ?? "redis"
export const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6380)
export const AGENT_MAX_ITERATIONS = 25

export const MAX_CONTEXT_WINDOW_LENGTH = 1_28_000
export const COMPACTION_PARAMETER = 10
export const COMPACT_THRESHOLD = 0.8*MAX_CONTEXT_WINDOW_LENGTH
export const CODER_MAX_ITERATIONS = 24
export const DEBUGGERR_MAX_ITERATIONS = 10
// Researcher/tester are single-shot (see SubAgent.isSingleShotAgent), so their
// loop breaks on the first pass and these caps never actually bind.
export const RESEARCHER_MAX_ITERATIONS = 1
export const TESTER_MAX_ITERATIONS = 1
// I capped Iterations for each agent
export const UI_EXPERT_MAX_ITERATIONS = 14
export const TESTER_DEBUGGER_LOOP_MAX_ITERATIONS = 3
export const RUN_MAX_LLM_CALLS = 120
export const RECENT_TURNS_LIMIT = 50
export const TOOL_RESULT_MAX_CHARS = 2000
// only for READ tool, so that context window gets feed properly to the agents.
export const READ_RESULT_MAX_CHARS = 15000
export const WRITE_ECHO_MAX_CHARS = 800
// files/dirs prohibited by sandbox <-> R2 sync.
export const REPO_TREE_PRUNE_DIRS = [
    'node_modules', '.git', 'dist', 'build', '.next', '.turbo',
    'coverage', '.cache', '.vite', '.output', 'vendor'
]
export const REPO_TREE_MAX_ENTRIES = 400
export const RUN_COMMAND_TIMEOUT_MS = 300_000
export const SYNC_R2_TIMEOUT_MS = 300_000
export const SANDBOX_TIMEOUT_MS = 60 * 60 * 1000
export const SANDBOX_KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000
export const TASK_SANDBOX_RETRY_LIMIT = 5
export const SUBAGENT_LLM_RETRY_ATTEMPTS = 5
export const SUBAGENT_TOOL_RETRY_ATTEMPTS = 2
export const SUBAGENT_RETRY_BACKOFF_MS = 3000
// subagents max retry
export const SUBAGENT_TASK_RETRY_ATTEMPTS = 2
export const AGENT_LLM_RETRY_ATTEMPTS = 5
// A 429 needs to wait out a window, not the ~1s a transient failure needs. Occurred with GPT a lot that's made a dedicated temporary hold.
export const RATE_LIMIT_BACKOFF_MS = 20_000
export const RETRY_MAX_BACKOFF_MS = 60_000

// Design pre-phase (Stitch). Concurrent calls used to share one Stitch
// transport (the SDK's module-level singleton), causing a cascading
// "Already connected to a transport" failure. Fixed at the root — makeOneScreen
// now gives every call its own client/transport — so this runs concurrently
// again, no longer capped at the old 3.
export const STITCH_DESIGN_CONCURRENCY = 5
// Whole-screen generation retries before a screen is marked degraded (built
// design-less rather than failing the run).
export const STITCH_DESIGN_RETRY_ATTEMPTS = 3
export const STITCH_DESIGN_BACKOFF_MS = 2_000
