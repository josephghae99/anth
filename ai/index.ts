import { anthropic } from "@ai-sdk/anthropic";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const claudeModel = wrapLanguageModel({
  model: anthropic("claude-3-opus-20240229"),
  middleware: customMiddleware,
});

export const claudeHaikuModel = wrapLanguageModel({
  model: anthropic("claude-3-haiku-20240307"),
  middleware: customMiddleware,
});
