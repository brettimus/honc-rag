import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless';
import { cosineDistance, desc, gt, sql as magicSql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http';
import { recipes } from './db/schema';
import { createEmbedding } from './embeddings';
import OpenAI from 'openai';
import { Layout, SearchForm, SearchResults } from './component';

type Bindings = {
  OPENAI_API_KEY: string;
  DATABASE_URL: string;
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
  const client = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const queryEmbedding = await createEmbedding(client, query);

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

export default app
