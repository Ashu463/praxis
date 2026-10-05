import base from "./schema/base.graphql" with { type: "text" };
import user from "./schema/user.graphql" with { type: "text" };
import project from "./schema/project.graphql" with { type: "text" };
import run from "./schema/run.graphql" with { type: "text" };
import chat from "./schema/chat.graphql" with { type: "text" };
import design from "./schema/design.graphql" with { type: "text" };
import question from "./schema/question.graphql" with { type: "text" };
import uiPreference from "./schema/uiPreference.graphql" with { type: "text" };
import access from "./schema/access.graphql" with { type: "text" };
import stream from "./schema/stream.graphql" with { type: "text" };
import internal from "./schema/internal.graphql" with { type: "text" };

export const typeDefs = [
  base,
  user,
  project,
  run,
  chat,
  design,
  question,
  uiPreference,
  access,
  stream,
  internal,
];
