import { useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useRun } from "@/lib/run";
import { getStoredSession } from "@/lib/session";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { ADMIN_EMAIL } from "@/lib/admin";

// Only the admin account can kick off new runs, so a public link doesn't quietly
// burn through paid API tokens. Everyone else sees the bar, just disabled.

export function HomeChatBox() {
  const { session, sessionExpired } = useAuth();
  const isAdmin = session?.user.email === ADMIN_EMAIL;
  const { submit } = useRun();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState(() => searchParams.get("prompt") ?? "");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Reads localStorage directly rather than the `session` above — this can
    // run right after a Google login resolves, before this component's own
    // re-render lands, so the closed-over `session` would still read stale.
    if (!isAdmin || !prompt.trim() || !getStoredSession()) return;
    const text = prompt.trim();
    setPrompt("");
    const runId = await submit(text);
    if (runId) navigate(`/w/${runId}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-border-hover bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-1.5 border-b border-border px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">
          <span className="h-[9px] w-[9px] rounded-full bg-border-hover" />
          <span className="h-[9px] w-[9px] rounded-full bg-border-hover" />
          <span className="h-[9px] w-[9px] rounded-full bg-border-hover" />
          <span className="ml-2">run · new</span>
        </div>

        <div className="px-4 py-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !!session && !isAdmin
                ? `New builds are limited to admin ${ADMIN_EMAIL} right now. I highly urge you to look at the live projects below — those are worth a look`
                : "Ask Praxis to build a landing page for…"
            }
            rows={3}
            className="text-lg"
          />
        </div>

        <div className="flex items-center justify-end border-t border-border px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            {session ? (
              <button
                onClick={handleSubmit}
                disabled={!isAdmin || !prompt.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            ) : (
              <GoogleLoginButton
                onSuccess={() => prompt.trim() && handleSubmit()}
                onError={setAuthError}
              />
            )}
          </div>
        </div>
      </div>

      {!session && (
        <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
          {authError ??
            (sessionExpired
              ? "Your session is no longer valid. Please sign in again."
              : "Sign in with Google to start building.")}
        </p>
      )}
    </div>
  );
}
