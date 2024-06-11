import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

import * as schema from "./src/db/schema";

const { recipes } = schema;

type RecipeTitles = Array<{ title: string }>;
type RecipeInsert = typeof schema.recipes.$inferInsert;

config({ path: '.dev.vars' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set: Be sure to create a .dev.vars file!");
}

const RECIPE_TITLES_FILE = "data/recipe-titles.json";

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

/**
 * Simple function to seed the database with some sample data.
 * Currently, this is just recipe titles.
 * 
 * NOTE - Skips seeding duplicates
 */
async function main() {
  try {
    console.log("Seeding recipes...");
    const seedData = getRecipeSeedData(RECIPE_TITLES_FILE);
    const existingRecords = await getAllRecipes();
    const recordsToSeed = findRecordsToSeed(seedData, existingRecords);
    await db.insert(recipes).values(recordsToSeed);
    console.log("Seeding completed");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

main();

/**
 * Helper function that finds all seed data that is not present in the database.
 * This prevents seeding duplicate recipes.
 */
function findRecordsToSeed(seedData: RecipeTitles, databaseRecords: RecipeTitles) {
  return seedData.filter((seed) => !databaseRecords.find((database) => database.title === seed.title));
}

/**
 * Read all recipes from the database
 */
async function getAllRecipes() {
  return db.select({ title: recipes.title }).from(recipes);
}

/**
 * Read a JSON file containing a list of recipe titles
 * And transform those recipe titles into an array of objects we can save in the database
 */
function getRecipeSeedData(filename: string) {
  const recipes = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return recipes.map((title: string) => ({ title })) as Array<RecipeInsert>;
}
