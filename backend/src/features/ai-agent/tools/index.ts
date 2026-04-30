import { tool } from "@langchain/core/tools";
import { z } from "zod";

// --- MEMORY TOOLS ---

export const retrieveLongTermMemory = tool(
  async ({ userId }) => {
    // Tương lai: Lấy từ Firestore db.collection('users').doc(userId).collection('long_term_memory').get()
    return `User prefers concise answers and uses TypeScript mostly.`;
  },
  {
    name: "retrieve_long_term_memory",
    description: "Tra cứu sở thích, ngôn ngữ yêu thích, và trình độ của người dùng.",
    schema: z.object({ userId: z.string() })
  }
);

export const retrieveEpisodicMemory = tool(
  async ({ query, userId }) => {
    // Tương lai: Vector Search trên Episodic Memory
    return `Gần đây user đã gặp lỗi 'infinite loop' và được gợi ý kiểm tra điều kiện thoát vòng lặp.`;
  },
  {
    name: "retrieve_episodic_memory",
    description: "Tra cứu các vấn đề tương tự hoặc bug mà user đã gặp trong quá khứ.",
    schema: z.object({ query: z.string(), userId: z.string() })
  }
);

export const retrieveSemanticKnowledge = tool(
  async ({ query }) => {
    // Tương lai: RAG (Retrieval-Augmented Generation) trên tài liệu lập trình
    return `Tài liệu: Trong TypeScript, sử dụng interface để định nghĩa cấu trúc object thay vì type cho các trường hợp có thể mở rộng (extend).`;
  },
  {
    name: "retrieve_semantic_knowledge",
    description: "Tìm kiếm kiến thức lập trình chung, tài liệu API, hoặc best practices.",
    schema: z.object({ query: z.string() })
  }
);

export const storeMemory = tool(
  async ({ fact, userId, type }) => {
    // Tương lai: Lưu vào Firestore
    console.log(`[Memory Store] Saving ${type} memory for ${userId}: ${fact}`);
    return `Đã lưu memory thành công.`;
  },
  {
    name: "store_memory",
    description: "Lưu thông tin mới về người dùng (sở thích, lỗi vừa sửa) vào bộ nhớ dài hạn.",
    schema: z.object({ 
      fact: z.string(), 
      userId: z.string(),
      type: z.enum(["long_term", "episodic"])
    })
  }
);

// Mảng gom tất cả tools
export const agentTools = [
  retrieveLongTermMemory,
  retrieveEpisodicMemory,
  retrieveSemanticKnowledge,
  storeMemory
];
