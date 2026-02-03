import "dotenv/config";
import { z } from "zod";
import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ProxyAgent, setGlobalDispatcher } from "undici";

import { createDeepAgent, type SubAgent, FilesystemBackend } from "deepagents";

// 如果设置了 PROXY_URL 环境变量，则启用代理
if (process.env.PROXY_URL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  setGlobalDispatcher(new ProxyAgent(process.env.PROXY_URL));
  console.log(`[Proxy] Enabled: ${process.env.PROXY_URL}`);
}

/**
 * 本地知识库研究 Agent
 *
 * 这个示例展示了如何使用本地知识库（文件系统）来进行研究，
 * 无需 Tavily API Key 或其他网络搜索工具。
 *
 * 知识库位置：./knowledge/
 */

// 本地知识库搜索工具
const knowledgeBaseSearch = tool(
  async ({ query, maxResults = 5 }: { query: string; maxResults?: number }) => {
    /**
     * 在本地知识库中搜索相关信息
     *
     * 注意：这个工具实际上是由 Agent 使用文件系统工具来实现的。
     * Agent 会使用 grep 搜索关键词，然后 read_file 读取相关文档。
     */
    return `知识库搜索功能已启用。Agent 将使用以下工具搜索本地知识库：
- grep: 搜索包含 "${query}" 的文档
- read_file: 读取相关文档内容
- glob: 查找所有知识库文件

知识库位置: ./knowledge/`;
  },
  {
    name: "knowledge_base_search",
    description:
      "Search the local knowledge base for information. Use this tool to find relevant documents in the local knowledge base.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find in the knowledge base"),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of documents to return"),
    }),
  },
);

const subResearchPrompt = `You are a dedicated researcher. Your job is to conduct research based on the users questions using the local knowledge base.

You have access to a local knowledge base located at ./knowledge/ containing documents about:
- LangGraph (langgraph-intro.md)
- Deep Agents (deep-agents-guide.md)
- AI Agent patterns (ai-agent-patterns.md)

Use the following tools to research:
1. \`ls\` - List files in the knowledge base
2. \`glob\` - Find files matching a pattern
3. \`grep\` - Search for keywords in documents
4. \`read_file\` - Read the content of relevant documents

Research process:
1. First, use \`ls\` or \`glob\` to see what documents are available
2. Use \`grep\` to search for relevant keywords
3. Use \`read_file\` to read the full content of relevant documents
4. Synthesize the information and provide a detailed answer

Conduct thorough research and then reply to the user with a detailed answer to their question.

Only your FINAL answer will be passed on to the user. They will have NO knowledge of anything except your final message, so your final report should be your final message!`;

const researchSubAgent: SubAgent = {
  name: "research-agent",
  description:
    "Used to research questions using the local knowledge base. Only give this researcher one topic at a time. Do not pass multiple sub questions to this researcher. Instead, you should break down a large topic into the necessary components, and then call multiple research agents in parallel, one for each sub question.",
  systemPrompt: subResearchPrompt,
  tools: [knowledgeBaseSearch],
};

const subCritiquePrompt = `You are a dedicated editor. You are being tasked to critique a report.

You can find the report at \`final_report.md\`.

You can find the question/topic for this report at \`question.txt\`.

The user may ask for specific areas to critique the report in. Respond to the user with a detailed critique of the report. Things that could be improved.

You can use the knowledge base search tool to look up information if needed to critique the report.

Do not write to the \`final_report.md\` yourself.

Things to check:
- Check that each section is appropriately named
- Check that the report is written as you would find in an essay or a textbook - it should be text heavy, do not let it just be a list of bullet points!
- Check that the report is comprehensive. If any paragraphs or sections are short, or missing important details, point it out.
- Check that the article covers key areas of the industry, ensures overall understanding, and does not omit important parts.
- Check that the article deeply analyzes causes, impacts, and trends, providing valuable insights
- Check that the article closely follows the research topic and directly answers questions
- Check that the article has a clear structure, fluent language, and is easy to understand.
`;

const critiqueSubAgent: SubAgent = {
  name: "critique-agent",
  description:
    "Used to critique the final report. Give this agent some information about how you want it to critique the report.",
  systemPrompt: subCritiquePrompt,
  tools: [knowledgeBaseSearch],
};

// Prompt prefix to steer the agent to be an expert researcher
const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research using the local knowledge base, and then write a polished report.

The local knowledge base is located at ./knowledge/ and contains the following documents:
- langgraph-intro.md - Introduction to LangGraph
- deep-agents-guide.md - Deep Agents usage guide
- ai-agent-patterns.md - AI Agent design patterns

The first thing you should do is to write the original user question to \`question.txt\` so you have a record of it.

Use the research-agent to conduct deep research. It will respond to your questions/topics with a detailed answer.

When you think you have enough information to write a final report, write it to \`final_report.md\`

You can call the critique-agent to get a critique of the final report. After that (if needed) you can do more research and edit the \`final_report.md\`
You can do this however many times you want until you are satisfied with the result.

Only edit the file once at a time (if you call this tool in parallel, there may be conflicts).

Here are instructions for writing the final report:

<report_instructions>

CRITICAL: Make sure the answer is written in the same language as the human messages! If you make a todo plan - you should note in the plan what language the report should be in so you dont forget!
Note: the language the report should be in is the language the QUESTION is in, not the language/country that the question is ABOUT.

Please create a detailed answer to the overall research brief that:
1. Is well-organized with proper headings (# for title, ## for sections, ### for subsections)
2. Includes specific facts and insights from the research
3. Cites the source documents (e.g., "According to deep-agents-guide.md...")
4. Provides a balanced, thorough analysis. Be as comprehensive as possible, and include all information that is relevant to the overall research question. People are using you for deep research and will expect detailed, comprehensive answers.
5. Includes a "Sources" section at the end listing all documents referenced

You can structure your report in a number of different ways. Here are some examples:

To answer a question that asks you to compare two things, you might structure your report like this:
1/ intro
2/ overview of topic A
3/ overview of topic B
4/ comparison between A and B
5/ conclusion

To answer a question that asks you to return a list of things, you might only need a single section which is the entire list.
1/ list of things or table of things
Or, you could choose to make each item in the list a separate section in the report. When asked for lists, you don't need an introduction or conclusion.
1/ item 1
2/ item 2
3/ item 3

To answer a question that asks you to summarize a topic, give a report, or give an overview, you might structure your report like this:
1/ overview of topic
2/ concept 1
3/ concept 2
4/ concept 3
5/ conclusion

If you think you can answer the question with a single section, you can do that too!
1/ answer

REMEMBER: Section is a VERY fluid and loose concept. You can structure your report however you think is best, including in ways that are not listed above!
Make sure that your sections are cohesive, and make sense for the reader.

For each section of the report, do the following:
- Use simple, clear language
- Use ## for section title (Markdown format) for each section of the report
- Do NOT ever refer to yourself as the writer of the report. This should be a professional report without any self-referential language. 
- Do not say what you are doing in the report. Just write the report without any commentary from yourself.
- Each section should be as long as necessary to deeply answer the question with the information you have gathered. It is expected that sections will be fairly long and verbose. You are writing a deep research report, and users will expect a thorough answer.
- Use bullet points to list out information when appropriate, but by default, write in paragraph form.

REMEMBER:
The brief and research may be in English, but you need to translate this information to the right language when writing the final answer.
Make sure the final answer report is in the SAME language as the human messages in the message history.

Format the report in clear markdown with proper structure and include source references where appropriate.

<Citation Rules>
- Cite documents using their filename (e.g., [deep-agents-guide.md], [langgraph-intro.md])
- End with ### Sources that lists each source with corresponding citation numbers
- IMPORTANT: Number sources sequentially without gaps (1,2,3,4...) in the final list
- Each source should be a separate line item in a list, so that in markdown it is rendered as a list.
- Example format:
  [1] deep-agents-guide.md
  [2] langgraph-intro.md
- Citations are extremely important. Make sure to include these, and pay a lot of attention to getting these right.
</Citation Rules>
</report_instructions>

You have access to a few tools.

## \`knowledge_base_search\`

Use this to search the local knowledge base for information. You can specify the search query.

## File System Tools

You also have access to file system tools to interact with the knowledge base:
- \`ls\` - List files in a directory
- \`read_file\` - Read file contents
- \`write_file\` - Write to a file
- \`edit_file\` - Edit a file
- \`glob\` - Find files matching a pattern
- \`grep\` - Search for text in files
`;

// Create the agent
export const agent = createDeepAgent({
  model: new ChatOpenAI({
    model: "deepseek-chat",
    temperature: 0,
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: "https://api.deepseek.com/v1",
    },
  }),

  tools: [knowledgeBaseSearch],
  systemPrompt: researchInstructions,
  subagents: [critiqueSubAgent, researchSubAgent],
  // Use FilesystemBackend to access the local knowledge base
  backend: (config) =>
    new FilesystemBackend({
      rootDir: "./knowledge",
      virtualMode: true,
    }),
});

// Invoke the agent
async function main() {
  const question = process.argv[2] || "What is LangGraph?";

  console.log(`🔍 Research question: ${question}\n`);
  console.log("📚 Using local knowledge base at: ./knowledge/\n");

  const result = await agent.invoke(
    {
      messages: [new HumanMessage(question)],
    },
    { recursionLimit: 100 },
  );

  console.log("\n🎉 Finished!\n");
  console.log(
    `\n\nAgent ToDo List:\n${result.todos.map((todo: { content: string; status: string }) => ` - ${todo.content} (${todo.status})`).join("\n")}`,
  );
  if (result.files) {
    console.log(
      `\n\nAgent Files:\n${Object.entries(result.files)
        .map(
          ([key, value]) => ` - ${key}: ${String(value).substring(0, 100)}...`,
        )
        .join("\n")}`,
    );
  }

  // Print final answer
  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\n\n📄 Final Report:\n");
  console.log(lastMessage.content);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
