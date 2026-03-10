import { createDeepAgent, type FileData } from "deepagents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";
import { CompositeBackend, StateBackend, StoreBackend } from "deepagents";
import { webExtract, webSearch } from "../utils/websearch-utils";
import { extractLastThreeBatches, extractTargetBatch } from "../utils/data-utils";
import { MemorySaver } from "@langchain/langgraph";
import { submitImplementationPlan } from "../utils/implementation-utils"
import { executePython } from "../utils/code-utils"
import { WebSocket } from "ws";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

export const logStream = new EventEmitter();

export interface LogMessage {
    message: string;
    timestamp: string;
    level: "info" | "error" | "debug";
}


function createFileData(content: string): FileData {
    const now = new Date().toISOString();
    return {
        content: content.split("\n"),
        created_at: now,
        modified_at: now,
    };
}


function loadSkillFiles(): Record<string, FileData> {
    const skillsDir = path.resolve(__dirname, "../skills");
    const files: Record<string, FileData> = {};

    const skillFolders = fs.readdirSync(skillsDir);
    for (const folder of skillFolders) {
        const skillPath = path.join(skillsDir, folder, "SKILL.md");
        if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, "utf-8");
            files[`/skills/${folder}/SKILL.md`] = createFileData(content);
        }
    }

    return files;
}


const checkModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: `${process.env.GEMINI_KEY}`,
    maxRetries: 0,
    temperature: 0,
});


export async function Check(query: string): Promise<boolean> {
    const skillPath = path.resolve(__dirname, "../skills/Check/SKILL.md");
    const skillContent = fs.readFileSync(skillPath, "utf-8");

    const systemPrompt = `You are a guardrail classifier for a pharmaceutical batch manufacturing analysis agent.

Your ONLY job is to determine whether a user query falls within the allowed scope of pharmaceutical manufacturing.

Here is your reference skill document that defines the allowed and disallowed topics:

---
${skillContent}
---

## Instructions

Analyze the user's query and decide:
- Return EXACTLY "true" if the query is related to pharmaceutical manufacturing, batch analysis, RCA, deviation analysis, process quality, GMP compliance, or any topic listed under "Allowed Topics" in the skill document.
- Return EXACTLY "false" if the query falls outside pharmaceutical manufacturing scope, or matches any "Disallowed Topics" in the skill document.

You must respond with ONLY the word "true" or "false". No explanations, no extra text, no punctuation — just the single word.`;

    const response = await checkModel.invoke([
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: query },
    ]);

    const result = (typeof response.content === "string"
        ? response.content
        : ""
    ).trim().toLowerCase();

    return result === "true";
}


const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: `${process.env.GEMINI_KEY}`,
    maxRetries: 0,
    temperature: 0,
});


const systemPrompt = `You are a pharmaceutical batch manufacturing analysis agent specialized in Root Cause Analysis (RCA).

Your role is to analyze manufacturing batch data, compare batches, identify deviations, and produce statistical reports.

You MUST follow these rules:
1. Only respond to queries within the scope of pharmaceutical manufacturing. Decline anything else.
2. Use the skills provided to guide your workflow.

## Workflow

When asked to analyze a batch, follow this sequence:

### Step 1: Data Extraction
- Use \`extract_target_batch\` to get the current batch's manufacturing parameters and deviation data.
- Use \`extract_last_three_batches\` to get the 3 most recent preceding batches for comparison.

### Step 2: Implementation Plan
- Based on the data, select up to 4 statistical tests.
- You MUST call \`submit_implementation_plan\` with your test selections as JSON.
- The agent will PAUSE here and wait for user approval before proceeding.

### Step 3: Code Execution (only after user approves)
- For each selected test, generate Python code that:
  - Embeds the batch JSON data inline (the sandbox has no file access)
  - Runs the statistical test using pandas, numpy, scipy
  - Prints EVERY result (the sandbox only returns stdout)
  - Ends with a JSON summary via json.dumps()
- Execute the code using \`execute_python\`.

### Step 4: Report Generation
- Synthesize all test results into a comprehensive markdown report.
- Include: Key Findings, Per-Test Analysis with tables, Parameters of Concern, and an actionable Conclusion.
- Use severity indicators: 🔴 Critical, 🟡 Warning, 🟢 Normal.

### Step 5: Web Search (if needed)
- If the analysis reveals unusual deviations, use \`web_search\` to find relevant pharmaceutical guidelines.

## Important
- Always use real numbers from the data — never fabricate values.
- Maximum 4 statistical tests per analysis.
- Small sample size (3-4 batches) — avoid tests that require large N.
`;


const skillFiles = loadSkillFiles();
const checkpointer = new MemorySaver();

const agent = createDeepAgent({
    store: new InMemoryStore(),
    backend: (config) => new CompositeBackend(
        new StateBackend(config),
        { "/memories/": new StoreBackend(config) }
    ),
    model,
    tools: [executePython, webSearch, webExtract, extractLastThreeBatches, extractTargetBatch, submitImplementationPlan],
    skills: ["/skills/"],
    systemPrompt,
    checkpointer,
    interruptOn: {
        submit_implementation_plan: true,
    },
});


export interface StreamEvent {
    type: "status" | "tool_start" | "tool_end" | "plan_approval" | "final_output";
    tool?: string;
    data: any;
}

export type StreamCallback = (event: StreamEvent) => void;


export const defaultStreamLogger: StreamCallback = (event) => {
    switch (event.type) {
        case "status":
            console.log(`\n🔄 ${event.data}`);
            break;
        case "tool_start":
            console.log(`🔧 Calling ${event.tool}...`);
            break;
        case "tool_end":
            console.log(`✅ ${event.tool} done`);
            break;
        case "plan_approval":
            console.log(`\n📋 Implementation Plan Ready:`);
            console.log(event.data);
            console.log(`\n⏸️  Waiting for user approval...\n`);
            break;
        case "final_output":
            console.log(`\n📊 Final Report:\n`);
            console.log(event.data);
            break;
    }
};


function sendWS(ws: WebSocket, event: any) {
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(event));
    }
}


export async function Main(userMessage: string, onStream: StreamCallback = defaultStreamLogger, ws: WebSocket) {
    const threadId = `thread-${Date.now()}`;
    const config = {
        configurable: { thread_id: threadId },
        version: "v2" as const,
    };

    const initialStatus = { type: "status", data: "Starting batch analysis..." };
    onStream(initialStatus as StreamEvent);
    sendWS(ws, initialStatus);

    const eventStream = agent.streamEvents(
        { messages: [{ role: "user", content: userMessage }], files: skillFiles },
        config
    );

    let implementationPlan = "";

    for await (const event of eventStream) {
        if (event.event === "on_tool_start") {
            const toolEvent = { type: "tool_start", tool: event.name, data: `${event.name} analysis started` };
            onStream(toolEvent as StreamEvent);
            sendWS(ws, toolEvent);
        }
        if (event.event === "on_tool_end") {
            const toolEvent = { type: "tool_end", tool: event.name, data: "done" };
            onStream(toolEvent as StreamEvent);
            sendWS(ws, toolEvent);

            if (event.name === "submit_implementation_plan") {
                implementationPlan = event.data.output;
            }
        }
    }

    const planEvent = {
        type: "plan_approval",
        data: implementationPlan,
    };
    onStream(planEvent as StreamEvent);
    sendWS(ws, planEvent);

    return {
        threadId,
        plan: implementationPlan,
    };
}


export async function Resume(threadId: string, approved: boolean, onStream: StreamCallback = defaultStreamLogger, ws: WebSocket) {
    const config = {
        configurable: { thread_id: threadId },
        version: "v2" as const,
    };

    if (!approved) {
        const cancelStatus = { type: "status", data: "Analysis cancelled by user." };
        onStream(cancelStatus as StreamEvent);
        sendWS(ws, cancelStatus);
        return { cancelled: true };
    }

    const approveStatus = { type: "status", data: "Plan approved. Running statistical tests..." };
    onStream(approveStatus as StreamEvent);
    sendWS(ws, approveStatus);

    // Resume the agent from where it was interrupted
    const eventStream = agent.streamEvents(
        { messages: [{ role: "user", content: "Approved. Proceed with the implementation plan." }] },
        config
    );

    let finalOutput = "";

    for await (const event of eventStream) {
        if (event.event === "on_tool_start") {
            const toolEvent = { type: "tool_start", tool: event.name, data: event.data.input };
            onStream(toolEvent as StreamEvent);
            sendWS(ws, toolEvent);
        }
        if (event.event === "on_tool_end") {
            const toolEvent = { type: "tool_end", tool: event.name, data: "done" };
            onStream(toolEvent as StreamEvent);
            sendWS(ws, toolEvent);
        }
        if (event.event === "on_chat_model_stream") {
            const content = event.data?.chunk?.content;
            if (content) {
                finalOutput += content;
                sendWS(ws, { type: "chunk", data: content });
            }
        }
    }

    const finalEvent = { type: "final_output", data: finalOutput };
    onStream(finalEvent as StreamEvent);
    sendWS(ws, finalEvent);

    return { report: finalOutput };
}
