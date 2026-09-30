import { StatusLine } from "@/features/shell/StatusLine";
import { HomeChatBox } from "@/features/build/HomeChatBox";
import { StarredProjects } from "@/features/landing/StarredProjects";
import { ArchitectureMap } from "@/features/landing/ArchitectureMap";
import { RequestAccess } from "@/features/landing/RequestAccess";
import { BuildShowcase } from "@/features/landing/BuildShowcase";
import { AgentTyper } from "@/features/landing/AgentTyper";
import { useReveal } from "@/lib/useReveal";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// Plain bold hairline between landing sections — no decoration.
function SectionRule() {
  return <hr className="mx-6 h-0.5 border-0 bg-border-hover sm:mx-10" />;
}

export function Home() {
  const { session } = useAuth();
  const firstName = session?.user.name?.split(" ")[0];
  const { hash } = useLocation();
  const heroRef = useReveal<HTMLDivElement>();

  // main is its own scroll container, so /#architecture has to be scrolled to by hand
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <StatusLine />

        <main className="flex-1 overflow-y-auto">
          <div className="grid-panel relative px-6 pt-20 pb-16 sm:px-10">
            <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
              <div ref={heroRef} className="reveal-stagger">
                {/* wordmark first: the name is the headline, the promise follows */}
                <h1 className="text-gradient-accent pr-3 font-serif text-8xl leading-none italic sm:text-9xl lg:text-[10rem]">
                  Praxis
                </h1>

                {/* static on purpose: the replay on the right is the only thing moving */}
                <p className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  Describe an app{firstName ? `, ${firstName}` : ""}.
                  <br />
                  {/* typed name ends its own line, so typing never reflows the rest of the hook */}
                  Watch <AgentTyper />
                  <br />
                  building it live.
                </p>

                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                  A prompt goes in. A planner{" "}
                  <b className="font-semibold text-foreground">plans</b> it into
                  a dependency graph, specialised agents{" "}
                  <b className="font-semibold text-foreground">write</b>,{" "}
                  <b className="font-semibold text-foreground">test</b> and{" "}
                  <b className="font-semibold text-foreground">retry</b> until
                  it builds inside a live sandbox, and a working preview comes
                  back — streamed to you, event by event.
                </p>

                <div className="mt-10">
                  <HomeChatBox />
                </div>
              </div>
              <div>
                {/* label the replay so it reads as a demo, not decoration */}
                <p className="mb-3 flex items-center gap-3 font-mono text-xs tracking-[0.24em] text-accent uppercase">
                  <span className="h-px w-8 bg-accent" />
                  watch a build happen
                </p>
                <p className="mb-5 text-sm text-muted">
                  One prompt, three phases: design, plan, app. Click a phase to
                  jump to it.
                </p>
                <BuildShowcase />
              </div>
            </div>
          </div>

          <SectionRule />
          <StarredProjects />
          <SectionRule />
          <ArchitectureMap />
          <SectionRule />
          <RequestAccess />

          <footer className="border-t border-border px-6 py-8 text-center font-mono text-xs text-muted-foreground">
            <p>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy
              </Link>{" "}
              ·{" "}
              <Link to="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
