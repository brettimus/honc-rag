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
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);
  const allRecipes = await db.select({
    id: recipes.id,
    title: recipes.title,
  }).from(recipes);

  return c.html(
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Recipes</h1>
        <SearchForm />
        <h2 className="text-2xl font-semibold mb-4">Examples</h2>
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
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const query = c.req.query("query");
  const similarityCutoffStr = c.req.query("similarity");
  const similarityCutoff = Number.parseFloat(similarityCutoffStr || "0.5") ?? 0.5;

  // TODO - Improve this error case!
  if (!query) {
    return c.text("No search query provided");
  }

  const client = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });
  const queryEmbedding = await createEmbedding(client, query);
  const similarityQuery = magicSql<number>`1 - (${cosineDistance(recipes.embedding, queryEmbedding)})`;
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
