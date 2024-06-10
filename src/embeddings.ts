import type OpenAI from "openai";

/**
 * A few note sabout the OpenAI embedding model "text-embedding-3-small"
 * - Vector length for small model: 1536
 * - Max tokens for input: 8191
 * - These embeddings lack knowledge of events that occurred after September 2021.
 */
export async function createEmbedding(client: OpenAI, input: string) {
  const embedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input,
    encoding_format: "float",
  });

  const output = embedding.data[0].embedding;

  return output;
}
