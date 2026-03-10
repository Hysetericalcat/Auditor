import { tool } from "@langchain/core/tools";
import { z } from "zod";


const SANDBOX_URL = "http://localhost:8000";

export async function runSandboxCode(code: string, timeout: number = 30): Promise<{ success: boolean; output: string }> {
    const response = await fetch(`${SANDBOX_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, timeout }),
    });

    if (!response.ok) {
        return {
            success: false,
            output: `Sandbox server error: ${response.status} ${response.statusText}`,
        };
    }

    return await response.json() as { success: boolean; output: string };
}

export const executePython = tool(
    async ({ code, timeout }) => {
        const result = await runSandboxCode(code, timeout);
        return JSON.stringify(result);
    },
    {
        name: "execute_python",
        description:
            "Executes Python code in a sandboxed Docker container and returns the output. " +
            "Use this to run data analysis, computations, or any Python script safely.",
        schema: z.object({
            code: z.string().describe("The Python code to execute"),
            timeout: z
                .number()
                .optional()
                .default(30)
                .describe("Execution timeout in seconds (default: 30)"),
        }),
    }
);
