import { createDeepAgent, type FileData } from "deepagents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runSandboxCode } from "../utils/code-utils";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";
import { CompositeBackend, StateBackend, StoreBackend } from "deepagents";
import { webExtract, webSearch } from "../utils/websearch-utils";
import { extractLastThreeBatches, extractTargetBatch } from "../utils/data-utils";
import { MemorySaver } from "@langchain/langgraph";
import { submitImplementationPlan } from "../utils/implementation-utils"
import { executePython } from "../utils/code-utils"
import fs from "fs";
import path from "path";


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


export async function Main(userMessage: string, onStream: StreamCallback = defaultStreamLogger) {
    const threadId = `thread-${Date.now()}`;
    const config = {
        configurable: { thread_id: threadId },
        version: "v2" as const,
    };

    onStream({ type: "status", data: "Starting batch analysis..." });

    const eventStream = agent.streamEvents(
        { messages: [{ role: "user", content: userMessage }], files: skillFiles },
        config
    );

    let implementationPlan = "";

    for await (const event of eventStream) {
        if (event.event === "on_tool_start") {
            onStream({ type: "tool_start", tool: event.name, data: event.data.input });//just telling me what has happend ,what has not.
        }
        if (event.event === "on_tool_end") {
            onStream({ type: "tool_end", tool: event.name, data: "done" });

            if (event.name === "submit_implementation_plan") {
                implementationPlan = event.data.output;
            }
        }
    }

    onStream({
        type: "plan_approval",
        data: implementationPlan,
    });

    return {
        threadId,
        plan: implementationPlan,
    };
}


export async function Resume(threadId: string, approved: boolean, onStream: StreamCallback = defaultStreamLogger) {
    const config = {
        configurable: { thread_id: threadId },
        version: "v2" as const,
    };

    if (!approved) {
        onStream({ type: "status", data: "Analysis cancelled by user." });
        return { cancelled: true };
    }

    onStream({ type: "status", data: "Plan approved. Running statistical tests..." });

    // Resume the agent from where it was interrupted
    const eventStream = agent.streamEvents(
        { messages: [{ role: "user", content: "Approved. Proceed with the implementation plan." }] },
        config
    );

    let finalOutput = "";

    for await (const event of eventStream) {
        if (event.event === "on_tool_start") {
            onStream({ type: "tool_start", tool: event.name, data: event.data.input });
        }
        if (event.event === "on_tool_end") {
            onStream({ type: "tool_end", tool: event.name, data: "done" });
        }
        if (event.event === "on_chat_model_stream") {
            const content = event.data?.chunk?.content;
            if (content) {
                finalOutput += content;
            }
        }
    }

    onStream({ type: "final_output", data: finalOutput });

    return { report: finalOutput };
}