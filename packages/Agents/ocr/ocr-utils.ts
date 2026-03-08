import dotenv from "dotenv";
import * as fs from "fs";
import fss from "fs/promises";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import path from "path";
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

  export async function findFilesWithExtensions(
    dir: string,
    extension: string
  ) {
    const files = await fss.readdir(dir);
  
    return files.filter((file) =>
      file.endsWith(extension)
    );
  }
  
 
export async function invokeGeminiWithFallback(messages: any[], options: any = {}) {
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY
    ].filter(Boolean) as string[];

    if (keys.length === 0) {
        throw new Error("No Gemini API keys found in environment variables (GEMINI_KEY_1, GEMINI_KEY).");
    }

    let lastError: any = null;

    for (const key of keys) {
        try {
            const model = new ChatGoogleGenerativeAI({
                model: "gemini-2.5-flash",
                apiKey: key,
                maxRetries: 0,
                ...options
            });

            return await model.invoke(messages);
        } catch (err: any) {
            lastError = err;

            const isQuotaError =
                err.message.includes("429") ||
                err.message.includes("Too Many Requests") ||
                err.message.includes("quota") ||
                (err.status === 429);

            if (isQuotaError) {
                console.warn(`⚠️ Gemini API Key [${key.slice(-4)}] exhausted or rate limited. Trying next key if available...`);
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error("All Gemini API keys exhausted.");
}

export const Table_count: Record<string, number> = {
    "1": 0, "2": 1, "3": 1, "4": 1, "5": 0, "6": 1, "7": 1, "8": 0, "9": 0, "10": 0,
    "11": 0, "12": 2, "13": 0, "14": 2, "15": 0, "16": 0, "17": 0, "18": 0, "19": 0, "20": 0,
    "21": 2, "22": 0, "23": 0, "24": 1, "25": 1, "26": 0, "27": 0, "28": 0, "29": 0, "30": 0,
    "31": 2, "32": 2, "33": 1, "34": 1, "35": 0, "36": 2, "37": 0, "38": 2, "39": 0, "40": 2,
    "41": 0, "42": 2, "43": 0, "44": 0, "45": 2, "46": 1, "47": 3, "48": 0, "49": 0, "50": 0,
    "51": 1, "52": 2, "53": 1, "54": 0, "55": 0, "56": 0, "57": 0, "58": 0, "59": 0, "60": 1,
    "61": 0, "62": 1, "63": 1, "64": 0, "65": 1, "66": 1, "67": 1, "68": 0, "69": 1, "70": 1,
    "71": 1, "72": 1, "73": 0, "74": 0, "75": 0, "76": 1, "77": 0, "78": 0, "79": 0, "80": 0,
    "81": 0, "82": 1, "83": 0, "84": 1, "85": 0, "86": 0, "87": 1, "88": 1, "89": 1, "90": 0,
    "91": 2, "92": 2, "93": 1, "94": 1, "95": 0, "96": 0, "97": 1, "98": 1, "99": 0
};
