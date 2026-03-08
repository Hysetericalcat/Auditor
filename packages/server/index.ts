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
    res.status(400).json({ error: "pages_no is required" });
    return;
  }

  try {
    console.log(`📑 [SERVER] OCR request received for page ${pages_no}`);
    const result = await OCR(pages_no);
    console.log(`✅ [SERVER] OCR complete for page ${pages_no}`);
    res.json(result);
  } catch (err: any) {
    console.error(`❌ [SERVER] OCR failed for page ${pages_no}:`, err);
    res.status(500).json({
      error: "OCR processing failed",
      message: err.message || String(err),
    });
  }
});

app.listen(3001, () => {
  console.log("🚀 Express server running on port 3001");
});