import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context";
import { requireUser } from "./context";

const ADMIN_EMAIL = "ashukasaudhan971@gmail.com";

export async function loadOwnedProject(ctx: GraphQLContext, projectId: string) {
  if (!ctx.isInternal) requireUser(ctx);

  const project = await ctx.prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new GraphQLError("Project not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  if (!ctx.isInternal && project.userId !== ctx.user!.id) {
    throw new GraphQLError("Not your project", {
      extensions: { code: "FORBIDDEN", http: { status: 403 } },
    });
  }

  return project;
}

export async function loadViewableProject(ctx: GraphQLContext, projectId: string) {
  if (!ctx.isInternal) requireUser(ctx);

  const project = await ctx.prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new GraphQLError("Project not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  if (ctx.isInternal || project.userId === ctx.user!.id) return project;

  const admin = await ctx.prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (admin?.id === project.userId) return project;

  throw new GraphQLError("Not your project", {
    extensions: { code: "FORBIDDEN", http: { status: 403 } },
  });
}

export async function loadOwnedRun(
  ctx: GraphQLContext,
  projectId: string,
  runId: string,
) {
  await loadOwnedProject(ctx, projectId);

  const run = await ctx.prisma.run.findFirst({ where: { id: runId, projectId } });
  if (!run) {
    throw new GraphQLError("Run not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  return run;
}

export async function loadViewableRun(
  ctx: GraphQLContext,
  projectId: string,
  runId: string,
) {
  await loadViewableProject(ctx, projectId);

  const run = await ctx.prisma.run.findFirst({ where: { id: runId, projectId } });
  if (!run) {
    throw new GraphQLError("Run not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  return run;
}

export function requireInternal(ctx: GraphQLContext) {
  if (!ctx.isInternal) {
    throw new GraphQLError("Internal service token required", {
      extensions: { code: "FORBIDDEN", http: { status: 403 } },
    });
  }
}

export async function loadOwnedRunById(ctx: GraphQLContext, runId: string) {
  const run = await ctx.prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    throw new GraphQLError("Run not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  await loadOwnedProject(ctx, run.projectId);
  return run;
}

export async function loadViewableRunById(ctx: GraphQLContext, runId: string) {
  const run = await ctx.prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    throw new GraphQLError("Run not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  await loadViewableProject(ctx, run.projectId);
  return run;
}
