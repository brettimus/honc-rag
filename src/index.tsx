import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless';
import { cosineDistance, desc, eq, gt, sql as magicSql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http';
import { recipes } from './db/schema';
import { createEmbedding } from './embeddings';
import { Layout, SearchForm, SearchResults } from './component';

type Bindings = {
  DATABASE_URL: string;
  // Cloudflare Workers AI binding
  // enabled in wrangler.toml with
  // > [ai]
  // > binding = "AI"
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>()

/**
 * Render a basic UI for showing all recipes in the database, 
 * as well as a form for searching those recipes.
 */
app.get('/', async (c) => {
  // Set up the orm
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  // Query all recipes in the database
  const allRecipes = await db.select({
    id: recipes.id,
    title: recipes.title,
  }).from(recipes);

  return c.html(
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Recipes</h1>
        <SearchForm />
        <h2 className="text-2xl font-semibold mb-4">All Recipes</h2>
        <SearchResults results={allRecipes} />
      </div>
    </Layout>
  )
});

/**
 * Render search results based on the query and similarity cutoff.
 * 
 * - Default to a similarity cutoff of 0.5
 */
app.get('/recipes/search', async (c) => {
  // Set up the orm
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  // Parse the query parameters
  const query = c.req.query("query");
  const similarityCutoffStr = c.req.query("similarity");
  // NOTE - The cutoff (between 0 and 1) determines how similar results can be
  //        We default to 0.5
  const similarityCutoff = Number.parseFloat(similarityCutoffStr || "0.5") ?? 0.5;

  // Return an error if no query was provided
  if (!query) {
    // TODO - Improve this error page!
    return c.text("No search query provided", 422);
  }

  // Create an embedding from the user's query
  // const queryEmbedding = await createEmbedding(query);
  const queryEmbedding = await createEmbedding(c.env.AI, query)

  // Craft a similarity search based on the cosine distance between:
  // - the embedding of the user's query, and 
  // - the embedding of each recipe
  const similarityQuery = magicSql<number>`1 - (${cosineDistance(recipes.embedding, queryEmbedding)})`;

  // Search for recipes with a similarity above the cutoff
  // - order results by their similarity score
  // - return at a maximum 10 results
  const results = await db.select({
    id: recipes.id,
    title: recipes.title,
    similarity: similarityQuery,
  }).from(recipes)
    .where(gt(similarityQuery, similarityCutoff))
    .orderBy(desc(similarityQuery))
    .limit(10);

  return c.html(
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Recipes</h1>
        <SearchForm query={query} similarity={similarityCutoff} />
        <SearchResults results={results} />
      </div>
    </Layout>
  )
});

/**
 * API helper to generate embeddings
 *
 * We do this via the api since we do not have access to the Cloudflare AI bindings outside of a worker
 * and the `@cloudflare/ai` package is deprecated in favor of just using bindings.
 */
app.post('/api/generate-embeddings', async c => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const ai = c.env.AI;

  const start = Date.now();
  try {
    const recipesToUpdate = await db.select({
      id: recipes.id,
      title: recipes.title
    }).from(recipes);

    for (const recipe of recipesToUpdate) {
      const { id, title } = recipe;
      const embedding = await createEmbedding(ai, title);
      await db.update(recipes).set({ embedding }).where(eq(recipes.id, id));
    }
    const end = Date.now();
    const minutesElapsed = ((end - start) / 1000) / 60;
    console.log(`Embeddings created for recipes. Took ${minutesElapsed}mins`);

    return c.json({
      message: `Success! Updated ${recipesToUpdate.length} recipes with embeddings.`
    })
  } catch (error) {
    console.error("Failed to create recipe embeddings", error);
    return c.json({
      message: "Something went wrong generating embeddings"
    }, 500)
  }
})

function selectAllRecipes() {
  
}


export default app
