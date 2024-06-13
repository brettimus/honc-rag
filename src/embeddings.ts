
import { env, pipeline } from '@xenova/transformers'

// Configuration for server runtime
env.useBrowserCache = false;
env.allowLocalModels = false;

// env.wasm.numThreads

/**
 * A few notes sabout the `gte-small` embedding model
 * - Vector length for small model: 384
 * - Max tokens for input: 512
 */
export async function createEmbedding(input: string) {
  // OPTIMIZE - Initialize this once and cache across ueses of createEmbedding
  const pipe = await pipeline(
    'feature-extraction',
    'Supabase/gte-small',
  );
  const output = await pipe(input, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = Array.from(output.data);

  return embedding;
}
