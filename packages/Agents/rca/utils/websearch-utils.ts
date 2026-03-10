import { tavily } from "@tavily/core"
import { z } from "zod";
import { tool } from "@langchain/core/tools";
// @ts-ignore — deepagents has no type declarations

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
})

export async function Search(query:string){
    const response = await tavilyClient.search(query, {
    searchDepth: "advanced"
    })
    return response
}

export async function Extraction(urls:string []){
  const response = tavilyClient.extract(urls)  
  return response
}

export const webSearch = tool(
  async ({ query, searchDepth, topic, maxResults, includeAnswer }) => {
      const response = await tavilyClient.search(query, {
          searchDepth,
          topic,
          maxResults,
          includeAnswer,
      });
      return JSON.stringify(response);
  },
  {
      name: "web_search",
      description:
          "Searches the web using Tavily and returns relevant results. " +
          "Use this to find up-to-date information, articles, documentation, or answers to questions.",
      schema: z.object({
          query: z.string().describe("The search query"),
          searchDepth: z
              .enum(["basic", "advanced"])
              .optional()
              .default("basic")
              .describe("Search depth — 'basic' is faster, 'advanced' is more thorough"),
          topic: z
              .enum(["general", "news", "finance"])
              .optional()
              .default("general")
              .describe("Topic category for the search"),
          maxResults: z
              .number()
              .optional()
              .default(5)
              .describe("Maximum number of results to return"),
          includeAnswer: z
              .boolean()
              .optional()
              .default(true)
              .describe("Whether to include an AI-generated answer summary"),
      }),
  }
);


export const webExtract = tool(
  async ({ urls, extractDepth, format }) => {
      const response = await tavilyClient.extract(urls, {
          extractDepth,
          format,
      });
      return JSON.stringify(response);
  },
  {
      name: "web_extract",
      description:
          "Extracts content from one or more URLs using Tavily. " +
          "Use this to get the full text content of web pages, articles, or documentation.",
      schema: z.object({
          urls: z
              .array(z.string())
              .describe("List of URLs to extract content from"),
          extractDepth: z
              .enum(["basic", "advanced"])
              .optional()
              .default("basic")
              .describe("Extraction depth — 'advanced' gets more detailed content"),
          format: z
              .enum(["markdown", "text"])
              .optional()
              .default("markdown")
              .describe("Output format for the extracted content"),
      }),
  }
);

