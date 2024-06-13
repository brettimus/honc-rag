import { pgTable, serial, text, timestamp, vector } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  // Use the drizzle `vector` helper to define an `embedding` column
  // The vectors we receive from OpenAI have length 1536
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});