import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { pollJob, extractTextContent, cleanOCRResponse } from "../ocr-utils.js";
import { findFilesWithExtensions } from "../ocr-utils.js"
import { invokeGeminiWithFallback } from "../ocr-utils.js"
import {Table_count} from "../ocr-utils.js"
dotenv.config();

const IMAGES_DIR = "/Users/chromeblood/audit_checker/audit_checker/Agents/data/bmr-batch-1";
const API_KEY = process.env.RUNPOD_API_KEY as string;
const ENDPOINT = process.env.ENDPOINT as string;
const PYTHON_SERVER_URL = "http://localhost:3002/process";

export type classes = "names_present" | "specifications_present" | "none"


export async function Stage1_agent(pages_no: string | number) {
  console.log(`🚀 [STAGE 1] Triggering layout detector for page ${pages_no}...`);
  const n_tables = Table_count[String(pages_no)]
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

export async function ImageTextExtractorAgent(imagePath: string) {

  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  const role_extraction_prompt = `Extract the name and role from the image. 
Output the result in the following JSON format:
{
  "name": "extracted name",
  "role": "extracted role"
}`
  const description_extraction_prompt = `Extract all information present in the image. 
Output the result as text.`
  const specification_extraction_prompt = `Extract the specification from the image.
Output the result as text only.`
  const text_classification_prompt = `Analyze the BMR page image and classify it into one category:

names_present
Return if the image contains person identifiers, including:
Names
Signatures
Initials
Names with roles (e.g., Done by, Checked by, Approved by)
Personnel titles (e.g., Operator, Supervisor, Manager, Analyst)

specifications_present
Return if the image contains technical or QC specifications, including:
Process parameters (temperature, time, pressure, RPM, speed)
Test limits or acceptance criteria (e.g., NMT 5.0%, 95–105%, NLT 80%)
Equipment settings
Method references (e.g., USP <905>, Ph. Eur.)
Target values with ranges

none
Return if neither category applies (e.g., headers, generic text, empty tables, blank areas).

Rules
Output exactly one word: names_present, specifications_present, or none
No explanations or extra text`

  const response = await invokeGeminiWithFallback([
    {
      role: "user",
      content: [
        { type: "text", text: text_classification_prompt },
        {
          type: "image_url",
          image_url: `data:image/jpeg;base64,${imageBase64}`
        }
      ]
    }
  ])
  const content: classes = (response as any).content || "";
  let extractedValue = "";

  if (content == "names_present") {
    const output = await invokeRunpod(imagePath, role_extraction_prompt);
    const rawContent = extractTextContent(output);
    extractedValue = cleanOCRResponse(rawContent);

  } else if (content == "specifications_present") {
    const output = await invokeRunpod(imagePath, specification_extraction_prompt);
    const rawContent = extractTextContent(output);
    extractedValue = cleanOCRResponse(rawContent);
  }
  else {
    const output = await invokeRunpod(imagePath, description_extraction_prompt);
    const rawContent = extractTextContent(output);
    extractedValue = cleanOCRResponse(rawContent);
  }
  return { extracted_value: extractedValue, content: content };
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

export async function TableOCR(pages_no: string | number) {
  const stage1Result = await Stage1_agent(pages_no) as any;

  if (stage1Result.status !== "success" || !stage1Result.structure) {
    throw new Error(`Stage 1 failed or returned no structure: ${JSON.stringify(stage1Result)}`);
  }

  const tableStructures = stage1Result.structure;
  const allTables: { table_data: any; extracted_values: Record<string, any> }[] = [];

  for (const tableData of tableStructures) {
    const tableIdx = tableData.table_index;
    const tableId = `table_${tableIdx.toString().padStart(2, '0')}`;

    console.log(`🚀 [STAGE 2 START] for ${tableId}`);
    const extractedValues = await Stage2_agent(pages_no, tableId, tableData.structure);
    console.log(`✅ [STAGE 2 COMPLETE] extracted ${Object.keys(extractedValues).length} cells for ${tableId}`);

    allTables.push({ table_data: tableData, extracted_values: extractedValues });
  }

  return allTables;
}

export async function TextOCR(pages_no: string | number) {
  const pageDir = path.join(IMAGES_DIR, `page_${pages_no}`);
  const allFiles = await findFilesWithExtensions(pageDir, ".jpg");


  const stripFiles = allFiles.filter(file => {
    return !file.includes(path.sep) && !file.includes("/");
  });

  console.log(`📝 [TextOCR] Found ${stripFiles.length} text strip images in page_${pages_no}`);

  const results = await Promise.all(
    stripFiles.map(async (file) => {
      const filePath = path.join(pageDir, file);
      console.log(`🔍 [TextOCR] Processing: ${file}`);
      const result = await ImageTextExtractorAgent(filePath);
      return result;
    })
  );

  return results;
}

function renderPageHTML(
  names: { extracted_value: string; content: classes }[],
  specifications: { extracted_value: string; content: classes }[],
  other: { extracted_value: string; content: classes }[],
  tables: { table_data: any; extracted_values: Record<string, any> }[]
): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BMR Page Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      padding: 32px;
      line-height: 1.6;
    }
    .report-container {
      max-width: 1100px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .report-header {
      background: linear-gradient(135deg, #1e3a5f, #2d5a8e);
      color: white;
      padding: 24px 32px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .section {
      padding: 24px 32px;
      border-bottom: 1px solid #e8e8e8;
    }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #2d5a8e;
      display: inline-block;
    }
    .section-content {
      font-size: 14px;
      color: #333;
    }
    .name-card {
      display: inline-block;
      background: #f0f4f8;
      border: 1px solid #d0dce8;
      border-radius: 8px;
      padding: 12px 18px;
      margin: 6px 8px 6px 0;
      font-size: 13px;
    }
    .name-card strong { color: #1e3a5f; }
    .text-block {
      background: #fafafa;
      border-left: 3px solid #2d5a8e;
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 0 6px 6px 0;
      white-space: pre-wrap;
      font-size: 13px;
    }
    .empty-notice {
      color: #999;
      font-style: italic;
      font-size: 13px;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-bottom: 20px;
    }
    .table-label {
      font-size: 13px;
      font-weight: 600;
      color: #555;
      margin-bottom: 8px;
    }
    table {
      border-collapse: collapse;
      font-family: 'Inter', sans-serif;
      background: white;
      border: 1px solid #333;
      table-layout: fixed;
      width: 100%;
    }
    td {
      padding: 5px;
      text-align: center;
      border: 1px solid #444;
      overflow: hidden;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">BMR Page Report</div>
`;

 
  html += `    <div class="section">
      <div class="section-title">1. Name Content</div>
      <div class="section-content">`;
  if (names.length > 0) {
    for (const item of names) {
      try {
        const parsed = JSON.parse(item.extracted_value);
        html += `\n        <div class="name-card"><strong>${parsed.name || "—"}</strong> — ${parsed.role || "—"}</div>`;
      } catch {
        html += `\n        <div class="name-card">${item.extracted_value}</div>`;
      }
    }
  } else {
    html += `\n        <p class="empty-notice">No name content detected.</p>`;
  }
  html += `\n      </div>\n    </div>\n`;

  html += `    <div class="section">
      <div class="section-title">2. Specifications</div>
      <div class="section-content">`;
  if (specifications.length > 0) {
    for (const item of specifications) {
      html += `\n        <div class="text-block">${item.extracted_value}</div>`;
    }
  } else {
    html += `\n        <p class="empty-notice">No specifications detected.</p>`;
  }
  html += `\n      </div>\n    </div>\n`;

  
  html += `    <div class="section">
      <div class="section-title">3. Other</div>
      <div class="section-content">`;
  if (other.length > 0) {
    for (const item of other) {
      html += `\n        <div class="text-block">${item.extracted_value}</div>`;
    }
  } else {
    html += `\n        <p class="empty-notice">No other text content detected.</p>`;
  }
  html += `\n      </div>\n    </div>\n`;
  html += `    <div class="section">
      <div class="section-title">4. Tables</div>
      <div class="section-content">`;
  if (tables.length > 0) {
    for (let i = 0; i < tables.length; i++) {
      const t = tables[i];
      html += `\n        <div class="table-label">Table ${i + 1}</div>`;
      html += `\n        <div class="table-wrapper">`;
      html += renderStructureHTML(t.table_data, t.extracted_values);
      html += `\n        </div>`;
    }
  } else {
    html += `\n        <p class="empty-notice">No tables detected.</p>`;
  }
  html += `\n      </div>\n    </div>\n`;

  html += `  </div>\n</body>\n</html>`;
  return html;
}

export async function OCR(pages_no: string | number) {
  console.log(`\n🚀 [OCR] Starting full OCR pipeline for page ${pages_no}...`);

  // Run TableOCR and TextOCR concurrently
  const [tableResults, textResults] = await Promise.all([
    TableOCR(pages_no),
    TextOCR(pages_no)
  ]);

  console.log(`✅ [OCR] TableOCR returned ${tableResults?.length ?? 0} tables`);
  console.log(`✅ [OCR] TextOCR returned ${textResults.length} text extractions`);


  const names = textResults.filter(r => r.content === "names_present");
  const specifications = textResults.filter(r => r.content === "specifications_present");
  const other = textResults.filter(r => r.content === "none");

  console.log(`   📋 Names: ${names.length}, Specs: ${specifications.length}, Other: ${other.length}`);
  const htmlOutput = renderPageHTML(names, specifications, other, tableResults ?? []);


  const outputPath = path.join(IMAGES_DIR, `page_${pages_no}`, "report.html");
  fs.writeFileSync(outputPath, htmlOutput, "utf-8");
  console.log(`💾 [OCR] HTML report saved to: ${outputPath}`);

  return {
    page: pages_no,
    names,
    specifications,
    other,
    tables: tableResults ?? [],
    html: htmlOutput,
    reportPath: outputPath
  };
}
