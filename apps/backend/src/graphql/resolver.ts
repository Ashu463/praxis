import { DateTimeScalar, JSONScalar } from "./scalars";
import { userResolvers } from "./modules/user";
import { projectResolvers } from "./modules/project";
import { runResolvers } from "./modules/run";
import { chatResolvers } from "./modules/chat";
import { designResolvers } from "./modules/design";
import { questionResolvers } from "./modules/question";
import { uiPreferenceResolvers } from "./modules/uiPreference";
import { accessResolvers } from "./modules/access";
import { streamResolvers } from "./modules/stream";
import { internalResolvers } from "./modules/internal";

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...runResolvers.Query,
    ...chatResolvers.Query,
    ...designResolvers.Query,
    ...questionResolvers.Query,
    ...uiPreferenceResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...designResolvers.Mutation,
    ...questionResolvers.Mutation,
    ...uiPreferenceResolvers.Mutation,
    ...accessResolvers.Mutation,
    ...internalResolvers.Mutation,
  },

  Subscription: {
    ...streamResolvers.Subscription,
  },

  Project: {
    ...projectResolvers.Project,
    ...runResolvers.Project,
    ...designResolvers.Project,
    ...questionResolvers.Project,
  },

  Run: runResolvers.Run,
  Todo: runResolvers.Todo,
  TaskSummary: runResolvers.TaskSummary,
  Question: questionResolvers.Question,
  UIPreferenceQuestion: uiPreferenceResolvers.UIPreferenceQuestion,
};
