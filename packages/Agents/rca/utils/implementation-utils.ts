import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const submitImplementationPlan = tool(
    async ({ plan }) => {
        return plan;
    },
    {
        name: "submit_implementation_plan",
        description:
            "Submit the implementation plan (selected statistical tests) for user approval. " +
            "You MUST call this tool after selecting your statistical tests and BEFORE executing any code. " +
            "The agent will pause and wait for user approval.",
        schema: z.object({
            plan: z.string().describe(
                "The implementation plan as a JSON array of test selections: " +
                '[{ "test": "...", "reason": "..." }]. Maximum 4 tests.'
            ),
        }),
    }
);
