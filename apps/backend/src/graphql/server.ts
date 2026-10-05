import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createHandler } from "graphql-sse/lib/use/express";
import type { Express } from "express";
import { typeDefs } from "./schema";
import { resolvers } from "./resolver";
import { createContext, type GraphQLContext } from "./context";

export const schema = makeExecutableSchema({ typeDefs, resolvers });

export async function mountGraphQL(app: Express, path = "/graphql") {
  const server = new ApolloServer<GraphQLContext>({ schema });
  await server.start();

  app.use(
    `${path}/stream`,
    createHandler({
      schema,
      context: async (req) => {
        const headers = req.headers as {
          authorization?: string;
          get?: (key: string) => string | null;
        };
        const authorization = typeof headers.get === "function" ? (headers.get("authorization") ?? undefined) : headers.authorization;

        const ctx = await createContext({ req: { headers: { authorization } } });
        return ctx as unknown as Record<PropertyKey, unknown>;
      },
    }),
  );

  app.use(path, expressMiddleware(server, { context: createContext }));

  return server;
}
