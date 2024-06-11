import fs from "node:fs";
import OpenAI from "openai";
import { config } from 'dotenv';
import { neon } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema';
import { createEmbedding } from './src/embeddings';
import { eq } from "drizzle-orm";

// Define a type for selecting recipes from the db,
// returning only the `id` and `title` columns
type RecipeSelect = Pick<typeof schema.recipes.$inferSelect, 'id' | 'title'>;

config({ path: '.dev.vars' });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set. Be sure to create a .dev.vars file!");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Be sure to create a .dev.vars file!");
}

const { recipes } = schema;

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const openaiClient = new OpenAI();

/**
 * Main function that generates embeddings for each recipe title in our database,
 * and updates the database record to include the embedding of the title.
 * 
 * Logs the time elapsed to generate the embeddings.
 */
export async function generateEmbeddings() {
  const start = Date.now();
  try {
    await addRecipeEmbeddings();
    const end = Date.now();
    const minutesElapsed = ((end - start) / 1000) / 60;
    console.log(`Embeddings created for recipes. Took ${minutesElapsed}mins`);
  } catch (error) {
    console.log("Failed to create recipe embeddings", error);
  }
}

/**
 * Fetch all recipes from the db and loop through each record,
 * updating the record to include the embedding of its title.
 */
async function addRecipeEmbeddings() {
  const recipesToUpdate = await getAllRecipes();

  for (const recipe of recipesToUpdate) {
    await updateRecipeEmbedding(recipe);
  }
}

/**
 * Create an embedding from a recipe's title,
 * and update the recipe database record with associated embedding
 */
async function updateRecipeEmbedding(recipe: RecipeSelect, shouldLog = false) {
  const { id, title } = recipe;
  const embedding = await createEmbedding(openaiClient, title);

  if (shouldLog) {
    logRecipe(recipe, embedding);
  }

  return db.update(recipes).set({ embedding }).where(eq(recipes.id, id));
}

/**
 * Read all recipes from the database
 */
async function getAllRecipes() {
  return db.select({ id: recipes.id, title: recipes.title }).from(recipes);
}

/**
 * Helper for logging the recipe record to the console while we're updating the embeddings
 */
function logRecipe(recipe: RecipeSelect, embedding: Array<number>) {
  const { title, id } = recipe;
  console.log(`
Id: ${id}
Title: ${title}...
Embedding: ${embedding.slice(0, 5).join(', ')}...
===========================
    `.trim());
}

