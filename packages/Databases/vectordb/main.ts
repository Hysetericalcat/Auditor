import dotenv from "dotenv"
dotenv.config()

import { QdrantClient } from '@qdrant/js-client-rest';
import { FlagEmbedding, EmbeddingModel } from 'fastembed';
import { v4 as uuidv4 } from "uuid";


const client = new QdrantClient({
  url:`${process.env.QDRANT_URL}`,
  apiKey: `${process.env.QDRANT_API}`,
});



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
