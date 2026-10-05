import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { prisma } from "../lib/prisma";

export interface GraphQLContext {
  prisma: typeof prisma;
  user: { id: string; email: string } | null;
  isInternal: boolean;
}

export async function createContext({
  req,
}: {
  req: { headers: Record<string, string | string[] | undefined> };
}): Promise<GraphQLContext> {
  const raw = req.headers.authorization;
  const authHeader = Array.isArray(raw) ? raw[0] : raw;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return { prisma, user: null, isInternal: false };
  }

  if (token === process.env.INTERNAL_SERVICE_TOKEN) {
    return { prisma, user: null, isInternal: true };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true },
    });
    if (!user) {
      return { prisma, user: null, isInternal: false };
    }

    return { prisma, user, isInternal: false };
  } catch {
    return { prisma, user: null, isInternal: false };
  }
}

export function requireUser(ctx: GraphQLContext): { id: string; email: string } {
  if (!ctx.user) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }
  return ctx.user;
}
