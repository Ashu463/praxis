import { useState } from "react";
import { gql, GqlError } from "@/lib/graphql";
import { useReveal } from "@/lib/useReveal";
import REQUEST_ACCESS from "@/graphql/requestAccess.graphql?raw";

// Newsletter-style ask at the end of the page; the nav's Contact scrolls here.
export function RequestAccess() {
  const ref = useReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  return (
    <section ref={ref} id="access" className="reveal-stagger mx-auto max-w-2xl px-6 py-20 text-center">
      <h2 className="font-display text-4xl font-semibold tracking-tight">
        Want to <span className="text-gradient-accent pr-1 font-serif font-normal italic">build</span> with Praxis?
      </h2>
      <p className="mt-3 mb-8 text-muted">Building is limited to approved accounts. Leave your email to ask for permission.</p>

      {status === "sent" ? (
        <p className="text-ok">Request sent — you&rsquo;ll hear back at {email.trim()}.</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus("sending");
            try {
              await gql(REQUEST_ACCESS, { email });
              setStatus("sent");
            } catch (err) {
              setError(err instanceof GqlError ? err.message : "Couldn't send the request.");
              setStatus("error");
            }
          }}
        >
          <div className="flex items-center rounded-full border border-border-hover bg-surface p-1.5 pl-6 text-left transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Type your email…"
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="bg-gradient-accent shrink-0 rounded-full px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Request access"}
            </button>
          </div>
          {status === "error" && <p className="mt-3 text-sm text-danger">{error}</p>}
        </form>
      )}
    </section>
  );
}
