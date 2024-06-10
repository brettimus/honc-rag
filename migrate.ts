import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { sql } from 'drizzle-orm' 
import { drizzle } from 'drizzle-orm/postgres-js';

config({ path: '.dev.vars' });

const pgConnection = postgres(`${process.env.DATABASE_URL}`,
  { ssl: 'require', max: 1 })

const database = drizzle(pgConnection);

const main = async () => {
  try {
    // NOTE - Neon requires you to create the `vector` extension yourself
    await database.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`)
    await migrate(database, { migrationsFolder: 'drizzle' });
    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main();