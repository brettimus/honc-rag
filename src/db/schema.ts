import { pgTable, serial, text, timestamp, vector } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  // Use the drizzle `vector` helper to define an `embedding` column
  // The vectors we receive from the model `gte-small` have length 384
  embedding: vector('embedding', { dimensions: 384 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});