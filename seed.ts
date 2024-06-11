import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

import * as schema from "./src/db/schema";

const { recipes } = schema;

type RecipeInsert = typeof schema.recipes.$inferInsert;

config({ path: '.dev.vars' });

const RECIPE_TITLES_FILE = "data/recipe-titles.json";

// biome-ignore lint/style/noNonNullAssertion: error from neon client is helpful enough to fix
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Simple function to seed the database with some sample data
 * Currently, this is just recipe titles
 */
async function main() {
  try {
    console.log("Seeding recipes...");
    const recipesToInsert = prepareRecipes(RECIPE_TITLES_FILE);
    await db.insert(recipes).values(recipesToInsert);
    console.log("Seeding completed");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

main();

/**
 * Read a JSON file containing a list of recipe titles
 * And transform those recipe titles into an array of objects we can save in the database
 */
function prepareRecipes(filename: string) {
  const recipes = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return recipes.map((title: string) => ({ title })) as Array<RecipeInsert>;
}
