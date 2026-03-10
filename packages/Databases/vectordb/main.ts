import dotenv from "dotenv"
dotenv.config()

import { QdrantClient } from '@qdrant/js-client-rest';
import { FlagEmbedding, EmbeddingModel } from 'fastembed';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";


const client = new QdrantClient({
  url: `${process.env.QDRANT_URL}`,
  apiKey: `${process.env.QDRANT_API}`,
});


const RCA_PASTDATA_COLLECTION = "rca_pastdata";
const RCA_DEVIATIONS_COLLECTION = "rca_deviations";

let model: any = null;

export async function QuadrantVectorStore(
  collection: string,
  machine: string,
  inputs: (string | any)[]
) {
  await client.createCollection(collection, {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  }).catch(() => { });

  if (!model) {
    model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallENV15,
    });
  }

  const messages = inputs.map(input => (typeof input === 'string' ? input : input.message));
  const embeddings: number[][] = [];

  for await (const batch of model.embed(messages, 64)) {
    embeddings.push(...batch);
  }

  console.log("First embedding size:", embeddings[0]?.length);
  console.log("Messages count:", messages.length);
  console.log("Embeddings count:", embeddings.length);

  if (embeddings.length !== messages.length) {
    throw new Error("Embedding count mismatch with messages");
  }

  const points = embeddings.map((vector, index) => {
    const input = inputs[index];
    const payload: any = {
      text: messages[index],
      machine,
      embedding_model: "BGESmallENV15",
      created_at: new Date().toISOString(),
    };

    if (typeof input === 'object' && input !== null) {
      if (input.frequency !== undefined) payload.frequency = input.frequency;
      if (input.serials !== undefined) payload.serials = input.serials;
    }

    return {
      id: uuidv4(),
      vector: Array.from(vector),
      payload,
    };
  });

  await client.upsert(collection, {
    wait: true,
    points,
  });
}

export async function EventAnalysisVectorStore(
  collection: string,
  reviewText: string,
  fullData: any
) {
  await client.createCollection(collection, {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  }).catch(() => { });

  if (!model) {
    model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallENV15,
    });
  }

  const embeddingGenerator = model.embed([reviewText]);
  const embeddingResult = await embeddingGenerator.next();

  if (!embeddingResult.value || !Array.isArray(embeddingResult.value) || embeddingResult.value.length === 0) {
    throw new Error("Failed to generate embedding for review text");
  }

  const rawVector = embeddingResult.value[0];
  const vector: number[] = Array.isArray(rawVector)
    ? rawVector.map(v => Number(v))
    : Array.from(rawVector).map(v => Number(v));

  const point = {
    id: uuidv4(),
    vector: vector,
    payload: {
      ...fullData,
      reviewText,
      created_at: new Date().toISOString(),
    }
  };

  await client.upsert(collection, {
    wait: true,
    points: [point],
  });
}

export async function QuadrantVectorquery(collection: string, query: string) {
  if (!model) {
    model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallENV15,
    });
  }

  const embeddingGenerator = model.embed([query]);
  const embeddingResult = await embeddingGenerator.next();

  if (!embeddingResult.value || !Array.isArray(embeddingResult.value) || embeddingResult.value.length === 0) {
    throw new Error("Failed to generate query embedding");
  }

  const rawVector = embeddingResult.value[0];
  const vector: number[] = Array.isArray(rawVector)
    ? rawVector.map(v => Number(v))
    : Array.from(rawVector).map(v => Number(v));

  if (vector.some(v => isNaN(v) || !isFinite(v))) {
    throw new Error("Query embedding contains invalid values");
  }

  console.log("Query embedding size:", vector.length);
  console.log("Query embedding sample:", vector.slice(0, 5));

  const results = await client.query(collection, {
    query: vector,
    with_payload: true,
    limit: 5,
  });

  return results.points;
}

export async function listCollections() {
  const res = await client.getCollections();
  return res.collections;
}



function loadBatchJsonFiles(dirPath: string): any[] {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
  return files.map(file => {
    const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
    return JSON.parse(raw);
  });
}


async function storeBatchesToCollection(collectionName: string, batches: any[]) {

  await client.createCollection(collectionName, {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  }).catch(() => { });

  if (!model) {
    model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallENV15,
    });
  }


  const summaries = batches.map(b =>
    `Batch ${b.batch_number} manufactured on ${b.manufacturing_date}`
  );

  const embeddings: number[][] = [];
  for await (const batch of model.embed(summaries, 64)) {
    embeddings.push(...batch);
  }

  const points = embeddings.map((vector, index) => ({
    id: uuidv4(),
    vector: Array.from(vector),
    payload: {
      ...batches[index],
      batch_number: batches[index].batch_number,
      manufacturing_date: batches[index].manufacturing_date,
    },
  }));

  await client.upsert(collectionName, {
    wait: true,
    points,
  });

  console.log(`[RCA] Stored ${points.length} batches in "${collectionName}"`);
}


export async function storeRCABatchData() {
  const rcaDataRoot = path.resolve(__dirname, "../../Agents/rca/rca-data");

  const pastDataDir = path.join(rcaDataRoot, "past-data");
  const deviationDataDir = path.join(rcaDataRoot, "deviation-data");

  const pastBatches = loadBatchJsonFiles(pastDataDir);
  const deviationBatches = loadBatchJsonFiles(deviationDataDir);

  console.log(`[RCA] Loading ${pastBatches.length} past-data batches & ${deviationBatches.length} deviation-data batches`);

  await storeBatchesToCollection(RCA_PASTDATA_COLLECTION, pastBatches);
  await storeBatchesToCollection(RCA_DEVIATIONS_COLLECTION, deviationBatches);

  console.log("[RCA] All batch data stored successfully.");
}



async function retrievePrecedingBatches(
  collectionName: string,
  batchNumber: string,
  count: number = 3
): Promise<any[]> {

  const targetResult = await client.scroll(collectionName, {
    filter: {
      must: [
        {
          key: "batch_number",
          match: { value: batchNumber },
        },
      ],
    },
    with_payload: true,
    limit: 1,
  });

  if (!targetResult.points || targetResult.points.length === 0) {
    throw new Error(`Batch "${batchNumber}" not found in collection "${collectionName}"`);
  }

  const targetPayload = targetResult.points[0].payload as any;
  const targetDate = targetPayload.manufacturing_date;

  console.log(`[RCA] Target batch ${batchNumber} has manufacturing_date: ${targetDate}`);

  const precedingResult = await client.scroll(collectionName, {
    filter: {
      must: [
        {
          key: "manufacturing_date",
          range: {
            lt: targetDate,
          },
        },
      ],
    },
    with_payload: true,
    limit: 100,
  });

  if (!precedingResult.points || precedingResult.points.length === 0) {
    console.log(`[RCA] No preceding batches found before batch ${batchNumber}`);
    return [];
  }

  const sorted = precedingResult.points
    .sort((a, b) => {
      const dateA = (a.payload as any).manufacturing_date;
      const dateB = (b.payload as any).manufacturing_date;
      return dateB.localeCompare(dateA); // descending
    })
    .slice(0, count);

  console.log(`[RCA] Found ${sorted.length} preceding batch(es) for batch ${batchNumber}`);

  return sorted.map(point => point.payload);
}


async function retrieveTargetBatch(collectionName: string, batchNumber: string): Promise<any | null> {
  const result = await client.scroll(collectionName, {
    filter: {
      must: [
        {
          key: "batch_number",
          match: { value: batchNumber },
        },
      ],
    },
    with_payload: true,
    limit: 1,
  });

  if (!result.points || result.points.length === 0) {
    return null;
  }

  return result.points[0].payload;
}

export async function retrieveTargetPastBatch(batchNumber: string) {
  return retrieveTargetBatch(RCA_PASTDATA_COLLECTION, batchNumber);
}

export async function retrieveTargetDeviationBatch(batchNumber: string) {
  return retrieveTargetBatch(RCA_DEVIATIONS_COLLECTION, batchNumber);
}

export async function retrievePastBatches(batchNumber: string, count: number = 3) {
  return retrievePrecedingBatches(RCA_PASTDATA_COLLECTION, batchNumber, count);
}

export async function retrieveDeviationBatches(batchNumber: string, count: number = 3) {
  return retrievePrecedingBatches(RCA_DEVIATIONS_COLLECTION, batchNumber, count);
}