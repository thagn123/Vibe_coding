import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentStateAnnotation, AgentState } from "../state";
import { agentTools } from "../tools";
import { getSystemPrompt } from "../prompts";

// 1. Khởi tạo LLM
const llm = new ChatOpenAI({
  modelName: process.env.GEMINI_MODEL || "gpt-4o", // Ở đây đang dùng OpenAI adapter cho tương thích, nếu dùng Gemini API trực tiếp cần config lại
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Bind tools vào LLM
const llmWithTools = llm.bindTools(agentTools);

// 2. Định nghĩa các Node

// Node Agent chính
const agentNode = async (state: AgentState) => {
  const { messages, intent, context } = state;
  
  // Tạo System Message dựa trên intent và context
  const sysMsg = new SystemMessage(getSystemPrompt(intent, context));
  
  const response = await llmWithTools.invoke([sysMsg, ...messages]);
  
  return { messages: [response] };
};

// Node Tool
const toolNode = new ToolNode<AgentState>(agentTools);

// Cạnh điều kiện xác định gọi tool hay tiếp tục
const shouldContinue = (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "reflexion";
};

// Node Reflexion (Tự kiểm tra)
const reflexionNode = async (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content.toString();
  
  // Guardrail đơn giản: Không được có chữ "đáp án là" hoặc chứa toàn bộ solution
  if (content.toLowerCase().includes("lời giải là") || content.toLowerCase().includes("reference_solution")) {
    const feedback = new HumanMessage("HỆ THỐNG CẢNH BÁO: Bạn vừa tiết lộ trực tiếp đáp án hoặc viết code giải hoàn chỉnh. Hãy viết lại câu trả lời dưới dạng gợi ý (hint) và hướng dẫn tư duy.");
    return { messages: [feedback], reflexionFeedback: "RETRY" };
  }
  
  return { reflexionFeedback: "OK" };
};

// Cạnh điều kiện sau reflexion
const afterReflexion = (state: AgentState) => {
  if (state.reflexionFeedback === "RETRY") {
    return "agent";
  }
  return END;
};

// 3. Build Graph
export const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("reflexion", reflexionNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    reflexion: "reflexion"
  })
  .addEdge("tools", "agent")
  .addConditionalEdges("reflexion", afterReflexion, {
    agent: "agent",
    [END]: END
  });

// Sử dụng MemorySaver để lưu short-term memory (Lịch sử hội thoại trong phiên)
const checkpointer = new MemorySaver();
export const agentApp = workflow.compile({ checkpointer });
