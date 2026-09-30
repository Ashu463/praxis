import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { gql, GqlError } from "@/lib/graphql";
import { useOpenProject } from "@/lib/useOpenProject";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";
import PROJECTS from "@/graphql/projects.graphql?raw";

interface ProjectRow {
  id: string;
  title: string;
  latestRunId: string | null;
  isStarred: boolean;
  createdAt: string;
}

// Landing showcase: only starred projects, same tiles the projects list uses.
export function StarredProjects() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openProject, openingId, openError } = useOpenProject();
  const ref = useReveal<HTMLDivElement>();

  useEffect(() => {
    if (!session) return;
    gql<{ projects: ProjectRow[] }>(PROJECTS)
      .then((res) => setProjects(res.projects.filter((p) => p.isStarred)))
      .catch((err) =>
        setError(
          err instanceof GqlError ? err.message : "Failed to load projects.",
        ),
      );
  }, [session]);

  let body;
  if (!session)
    body = (
      <p className="text-sm text-muted-foreground">
        Sign in to see the live projects.
      </p>
    );
  else if (error) body = <p className="text-sm text-red-400">{error}</p>;
  else if (!projects)
    body = <p className="text-sm text-muted-foreground">Loading…</p>;
  else if (projects.length === 0)
    body = (
      <p className="text-sm text-muted-foreground">No live projects yet.</p>
    );
  else
    body = (
      <>
        {openError && <p className="mb-4 text-sm text-red-400">{openError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              aria-busy={openingId === p.id}
              onClick={() => void openProject(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void openProject(p);
                }
              }}
              className={cn(
                "cursor-pointer p-5 text-left transition-colors hover:bg-surface-hover",
                openingId === p.id && "pointer-events-none opacity-60",
              )}
            >
              <h3 className="line-clamp-2 font-medium">{p.title}</h3>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {openingId === p.id
                  ? "Starting sandbox…"
                  : new Date(p.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      </>
    );

  return (
    // same outer padding + inner width as the hero, so every section starts on one left edge
    <section id="starred" className="px-6 py-10 sm:px-10">
      <div ref={ref} className="reveal-stagger mx-auto max-w-[1400px]">
        <h2 className="mb-8 font-display text-4xl font-semibold tracking-tight">
          Live projects{" "}
          <span className="text-gradient-accent pr-0.5 font-serif font-normal italic">
            Praxis
          </span>{" "}
          built
        </h2>
        {body}
      </div>
    </section>
  );
}
