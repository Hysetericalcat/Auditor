import dotenv from 'dotenv';
dotenv.config();
import { OCR } from "../Agents/ocr/tables/OCR"
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(express.json())
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))

app.post("/ocr", async (req: Request, res: Response) => {
  const { pages_no } = req.body;

  if (pages_no === undefined || pages_no === null) {
    res.status(400).json({ error: "pages_no is required (number, string, or array)" });
    return;
  }

  const pages: (string | number)[] = Array.isArray(pages_no) ? pages_no : [pages_no];

  if (pages.length === 0) {
    res.status(400).json({ error: "pages_no array must not be empty" });
    return;
  }

  try {
    console.log(`📑 [SERVER] OCR request received for ${pages.length} page(s): ${pages.join(", ")}`);

    const settled = await Promise.allSettled(
      pages.map(async (page) => {
        console.log(`🔄 [SERVER] Processing page ${page}...`);
        return await OCR(page);
      })
    );

    const results = settled.map((outcome, idx) => {
      if (outcome.status === "fulfilled") {
        return { page: pages[idx], status: "success" as const, data: outcome.value };
      } else {
        return { page: pages[idx], status: "error" as const, message: outcome.reason?.message || String(outcome.reason) };
      }
    });

    const successCount = results.filter(r => r.status === "success").length;
    console.log(`✅ [SERVER] OCR complete — ${successCount}/${pages.length} succeeded`);

    res.json({ results });
  } catch (err: any) {
    console.error(`❌ [SERVER] OCR failed:`, err);
    res.status(500).json({
      error: "OCR processing failed",
      message: err.message || String(err),
    });
  }
});

const LOG_PROB_FILE = "/Users/chromeblood/Auditor/packages/Agents/ocr/files";

app.get("/logprobs", async (req: Request, res: Response) => {
  const fs = await import("fs");
  const path = await import("path");
  const logprobsPath = path.join(LOG_PROB_FILE, "logprobs.json");

  if (!fs.existsSync(logprobsPath)) {
    res.status(404).json({ error: "logprobs.json not found. Run OCR first." });
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(logprobsPath, "utf-8"));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read logprobs.json", message: err.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 Express server running on port 3001");
});