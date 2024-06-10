import { config } from "dotenv";
import { generateEmbeddings } from "./embeddings/generate";

config({ path: '.dev.vars' });

/**
 * Simple function to seed the database with some sample data
 * Currently, this is just GitHub issues with their associated embeddings
 */
async function main() {
  try {
    console.log("Seeding... This may take about 30 seconds!");
    await generateEmbeddings();
    console.log("Seeding completed");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

main();