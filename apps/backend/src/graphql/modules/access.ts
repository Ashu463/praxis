import { GraphQLError } from "graphql";
import { randomUUIDv7 } from "bun";
import type { GraphQLContext } from "../context";
import { isValidEmail } from "../../lib/user.helpers";
import { logger } from "../../lib/utils";

export const accessResolvers = {
  Mutation: {
    requestAccess: async (_parent: unknown, args: { email: string }, ctx: GraphQLContext) => {
      const email = args.email.trim().toLowerCase();
      if (!isValidEmail(email)) {
        throw new GraphQLError("Invalid email", {
          extensions: { code: "BAD_USER_INPUT", http: { status: 400 } },
        });
      }
      // upsert so a repeat request just bumps updatedAt instead of piling up rows
      await ctx.prisma.accessRequest.upsert({
        where: { email },
        create: { id: randomUUIDv7(), email },
        update: {},
      });
      logger.info(`Access requested by ${email}`);
      return true;
    },
  },
};
