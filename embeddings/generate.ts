import fs from "node:fs";
import OpenAI from "openai";
import { config } from 'dotenv';
import { neon } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { createEmbedding } from '../src/embeddings';

type RecipeInsert = typeof schema.recipes.$inferInsert;

config({ path: '.dev.vars' });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const RECIPE_TITLES_FILE = "data/recipe-titles.json";

const { recipes } = schema;

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const openaiClient = new OpenAI();

/**
 * Main function that generates embeddings for each recipe title in our sample file,
 * and inserts the recipe title + embeddings into the database.
 */
export async function generateEmbeddings() {
  const start = Date.now();
  try {
    await createRecipeEmbeddings(RECIPE_TITLES_FILE);
    const end = Date.now();
    const minutesElapsed = ((end - start) / 1000) / 60;
    console.log(`Embeddings created for recipes. Took ${minutesElapsed}mins`);
  } catch (error) {
    console.log("Failed to create recipe embeddings", error);
  }
}


// Helper functions

async function createRecipeEmbeddings(filename?: string) {
  if (!filename) {
    console.log("No recipe filename provided, skipping...");
    return;
  }
  const recipesToInsert = prepareRecipes(filename);

  for (const recipe of recipesToInsert) {
    await createRecipe(recipe);
  }
}

// Helpers

function saveEmbedding(title: string, embedding: number[]) {
  return db.insert(recipes).values({
    title,
    embedding,
  })
}

/**
 * Create embeddings based off of some content, and add database record with associated embedding
 */
async function createRecipe(recipe: RecipeInsert, shouldLog = false) {
  const { title } = recipe;
  const embedding = await createEmbedding(openaiClient, title);

  if (shouldLog) {
    logRecipe(recipe, embedding);
  }

  await saveEmbedding(title, embedding);
}

/**
 * Helper for logging the knowledge record to the console
 */
function logRecipe(recipe: RecipeInsert, embedding: Array<number>) {
  const { title, } = recipe;
  console.log(`
Title: ${title}...
Embedding: ${embedding.slice(0, 5).join(', ')}...
===========================
    `.trim());
}

/**
 * Read a JSON file containing a list of recipe titles
 * And transform those recipe titles into an array of objects we can save in the database
 */
function prepareRecipes(filename: string) {
  const recipes = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return recipes.map((title: string) => ({ title })) as Array<RecipeInsert>;
}
