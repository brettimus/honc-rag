/**
 * A few notes sabout the `bge-base-en-v1.5` embedding model
 * - Vector length for small model: 768
 * - Max tokens for input: 512
 */
export async function createEmbedding(client: Ai, input: string) {
  const result = await client.run("@cf/baai/bge-base-en-v1.5", {
    text: [input]
  })

  return result.data[0];
}
