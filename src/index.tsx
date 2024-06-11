import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless';
import { cosineDistance, desc, gt, ilike, sql as magicSql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http';
import { recipes } from './db/schema';
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
 * Render search results based on the query, using keyword search
 */
app.get('/recipes/search', async (c) => {
  // Set up the ORM
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  // Grab the query from the query parameters
  const query = c.req.query("query");

  // Return an error if no query was provided
  if (!query) {
    // TODO - Improve this error page!
    return c.text("No search query provided", 422);
  }


  // Search for all recipes whose titles contain the search query (case insensitive)
  const results = await db.select({
    id: recipes.id,
    title: recipes.title,
  }).from(recipes)
    .where(ilike(recipes.title, `%${query}%`))
    .limit(10);

  return c.html(
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Recipes</h1>
        <SearchForm query={query} />
        <SearchResults results={results} />
      </div>
    </Layout>
  )
});

export default app
