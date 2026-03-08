import dotenv from "dotenv";
import * as fs from "fs";
dotenv.config();

const API_KEY = process.env.RUNPOD_API_KEY as string;
const STATUS_URL = process.env.STATUS_URL as string;

dotenv.config();
const IMAGES_DIR = "/Users/chromeblood/audit_checker/audit_checker/Agents/data/bmr-batch-1";
const ENDPOINT = process.env.ENDPOINT as string;
const PYTHON_SERVER_URL = "http://localhost:3002/process";


export async function pollJob(jobId: string): Promise<any> {
    if (!STATUS_URL || !API_KEY) {
        throw new Error("STATUS_URL or RUNPOD_API_KEY is not defined in environment variables.");
    }

    while (true) {
        const statusRes = await fetch(`${STATUS_URL}/${jobId}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
        });

        if (!statusRes.ok) {
            const errText = await statusRes.text();
            throw new Error(`Poll failed for job ${jobId}: HTTP ${statusRes.status} — ${errText}`);
        }

        const statusData = (await statusRes.json()) as {
            status: string;
            output?: any;
            error?: any;
        };

        if (!statusData.status) {
            throw new Error(`Poll returned no status for job ${jobId}: ${JSON.stringify(statusData).slice(0, 200)}`);
        }

        console.log(`🔄 Job ${jobId} — status: ${statusData.status}`);

        if (statusData.status === "COMPLETED") return statusData.output;

        if (statusData.status === "FAILED") {
            throw new Error(`Job ${jobId} failed: ${JSON.stringify(statusData.error)}`);
        }

        await new Promise((res) => setTimeout(res, 2000));
    }
}

export function extractTextContent(input: any): string {
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            return extractTextContent(parsed);
        } catch {
            return input;
        }
    }

    if (Array.isArray(input)) {
        return extractTextContent(input[0]);
    }

    if (input && typeof input === "object") {
        const content = input.choices?.[0]?.message?.content;
        if (content) return content;
        if (input.content) return input.content;
        if (Array.isArray(input.choices)) {
            return extractTextContent(input.choices[0]);
        }
        return JSON.stringify(input);
    }

    return String(input || "");
}

export function extractJsonMetadata(input: any): any {
    const text = extractTextContent(input);
    try {
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const contentToParse = codeBlockMatch ? codeBlockMatch[1] : text;
        const jsonMatch = contentToParse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(contentToParse);
    } catch (error) {
        console.error("Failed to extract JSON metadata:", error);
        return null;
    }
}

export function extractValuesFromTags(input: any): string[] | null {
    const text = extractTextContent(input);
    try {
        const match = text.match(/<values>\s*([\s\S]*?)\s*<\/values>/);
        if (match) {
            return JSON.parse(match[1].trim());
        }
        return null;
    } catch (error) {
        console.error("Failed to parse values from tags:", error);
        return null;
    }
}


export function cleanOCRResponse(content: string): string {
    let cleaned = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").trim();
    cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    return cleaned;
}

export async function invokeRunpod(imagePath: string, prompt: string) {
    const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  
    const submitRes = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
          logprobs: true,
          top_logprobs: 1,
          temperature: 0,
        },
      }),
    });
  
    if (!submitRes.ok) {
      throw new Error(`Runpod failed: ${submitRes.statusText}`);
    }
  
    const submitted = (await submitRes.json()) as { id: string };
    console.log(`📤 Submitted to Runpod — job: ${submitted.id}`);
    return await pollJob(submitted.id);
  }