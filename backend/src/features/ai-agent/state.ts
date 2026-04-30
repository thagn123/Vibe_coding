import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

// Define the State for our AI Assistant Graph
export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  context: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  intent: Annotation<"debug" | "tutor" | "prompt" | "general" | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  memories: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  reflexionFeedback: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
