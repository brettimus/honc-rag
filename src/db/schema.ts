import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});