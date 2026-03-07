import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { pollJob, extractTextContent, cleanOCRResponse} from "../ocr-utils.js";

dotenv.config();

const IMAGES_DIR = "/Users/chromeblood/audit_checker/audit_checker/Agents/data/bmr-batch-1";
const API_KEY = process.env.RUNPOD_API_KEY as string;
const ENDPOINT = process.env.ENDPOINT as string;
const PYTHON_SERVER_URL = "http://localhost:3002/process";



export async function Stage1_agent(pages_no: string | number) {
  console.log(`🚀 [STAGE 1] Triggering layout detector for page ${pages_no}...`);
  const n_tables = 1
  const response = await fetch(PYTHON_SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pages_no, n_tables })
  });

  if (!response.ok) {
    throw new Error(`Python server failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ [STAGE 1] Layout detection complete:`, data);
  return data;
}



async function invokeRunpod(imagePath: string, prompt: string) {
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


export async function Stage2_agent(pages_no: string | number, tableId: string, structure: any) {
  console.log(`📊 [STAGE 2] Extracting cell values for Page ${pages_no} ${tableId}...`);
  const tableDir = path.join(IMAGES_DIR, `page_${pages_no}`, tableId);
  if (!fs.existsSync(tableDir)) {
    throw new Error(`Table directory not found: ${tableDir}`);
  }

  const cellKeys = Object.keys(structure);
  console.log(`🚀 [STAGE 2] Processing ${cellKeys.length} cells with concurrency 5...`);

  const results: Record<string, any> = {};
  const concurrencyLimit = 5;
  const queue = [...cellKeys];

  async function processQueue() {
    while (queue.length > 0) {
      const key = queue.shift();
      if (!key) break;

      const filePath = path.join(tableDir, `${key}.jpg`);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [SKIP] Cell image not found: ${filePath}`);
        results[key] = "";
        continue;
      }

      const prompt = `
        STRICT TASK: Extract the value from this single table cell image.
        
        RULES:
        1. Extract only the word or number present in the image.
        2. If the cell is empty or contains only a hyphen (-), return "".
        3. OUTPUT: Return ONLY the raw string or number.
        
        NO reasoning. NO prefix. NO markdown blocks.
        `;

      try {
        const output = await invokeRunpod(filePath, prompt);
        const rawContent = extractTextContent(output);
        const value = cleanOCRResponse(rawContent);

        results[key] = value;
        console.log(`✅ Extracted [${key}]: ${value}`);
      } catch (err) {
        console.error(`❌ Error extracting [${key}]:`, err);
        results[key] = "ERROR";
      }
    }
  }

  const workers = Array.from({ length: concurrencyLimit }, () => processQueue());
  await Promise.all(workers);

  const resultsPath = path.join(tableDir, "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${resultsPath}`);

  return results;
}

function renderStructureHTML(tableData: any, extractedValues: Record<string, any>) {
  const structure = tableData.structure;
  const cellKeys = Object.keys(structure);
  let maxRow = 0;
  let maxCol = 0;
  cellKeys.forEach(key => {
    maxRow = Math.max(maxRow, structure[key].row);
    maxCol = Math.max(maxCol, structure[key].col);
  });
  const grid: string[][] = Array.from({ length: maxRow }, () => Array(maxCol).fill(""));
  const areas: Record<string, number> = {};

  cellKeys.forEach(key => {
    const parts: any = {};
    key.split("_").forEach(p => {
      parts[p[0]] = parseInt(p.substring(1));
    });
    areas[key] = (parts.w || 1) * (parts.h || 1);

    const { row, col } = structure[key];
    const rIdx = row - 1;
    const cIdx = col - 1;
    if (rIdx >= 0 && rIdx < maxRow && cIdx >= 0 && cIdx < maxCol) {
      const currentKey = grid[rIdx][cIdx];
      if (!currentKey || areas[key] < areas[currentKey]) {
        grid[rIdx][cIdx] = key;
      }
    }
  });

  const occupied = Array.from({ length: maxRow }, () => Array(maxCol).fill(false));

  let html = `<table border="1" style="border-collapse: collapse; font-family: 'Inter', sans-serif; background: white; border: 1px solid #333; table-layout: fixed;">`;
  html += `<tbody>`;

  for (let r = 0; r < maxRow; r++) {
    html += `<tr>`;
    for (let c = 0; c < maxCol; c++) {
      if (occupied[r][c]) continue;

      const key = grid[r][c];
      if (key) {
        let colspan = 1;
        while (c + colspan < maxCol && !grid[r][c + colspan] && !occupied[r][c + colspan]) {
          colspan++;
        }

        let rowspan = 1;
        while (r + rowspan < maxRow) {
          let rowPossible = true;
          for (let cc = c; cc < c + colspan; cc++) {
            if (grid[r + rowspan][cc] || occupied[r + rowspan][cc]) {
              rowPossible = false;
              break;
            }
          }
          if (rowPossible) rowspan++;
          else break;
        }

        for (let rr = r; rr < r + rowspan; rr++) {
          for (let cc = c; cc < c + colspan; cc++) {
            occupied[rr][cc] = true;
          }
        }
        const parts: any = {};
        key.split("_").forEach(p => {
          parts[p[0]] = parseInt(p.substring(1));
        });

        const value = extractedValues[key] || "";
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        const style = `padding: 5px; text-align: center; border: 1px solid #444; overflow: hidden; font-size: 13px;` +
          `width: ${parts.w}px; height: ${parts.h}px; min-width: ${parts.w}px; min-height: ${parts.h}px;`;

        html += `<td rowspan="${rowspan}" colspan="${colspan}" style="${style}">${displayValue}</td>`;
      } else {
        html += `<td style="border: 1px solid #eee; background: #fafafa;"></td>`;
        occupied[r][c] = true;
      }
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  return html;
}

export async function smartOCR(pages_no: string | number) {
  const stage1Result = await Stage1_agent(pages_no) as any;

  if (stage1Result.status !== "success" || !stage1Result.structure) {
    throw new Error(`Stage 1 failed or returned no structure: ${JSON.stringify(stage1Result)}`);
  }

  const tableStructures = stage1Result.structure; 
  const finalHtmls: string[] = [];

  for (const tableData of tableStructures) {
    const tableIdx = tableData.table_index;
    const tableId = `table_${tableIdx.toString().padStart(2, '0')}`;

    console.log(`🚀 [STAGE 2 START] for ${tableId}`);
    const extractedValues = await Stage2_agent(pages_no, tableId, tableData.structure);
    console.log(`✅ [STAGE 2 COMPLETE] extracted ${Object.keys(extractedValues).length} cells for ${tableId}`);

    const html = renderStructureHTML(tableData, extractedValues);
    finalHtmls.push(html);
  }

  const resultHtml = finalHtmls.join("<br/><hr/><br/>");
  console.log(`🏁 [smartOCR] Completed for page ${pages_no}. Generated ${finalHtmls.length} tables.`);

  if (resultHtml === "") {
    console.warn(`🛑 [smartOCR] Warning: No tables were processed.`);
  }

  return resultHtml;
}
