import { pgTable, uuid, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';

/**
 * X Account Cache Table
 * Caches X account search results to reduce API costs
 * TTL: 24 hours
 */
export const xAccountCache = pgTable('x_account_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  xHandle: text('x_handle').unique().notNull(),
  searchResponse: jsonb('search_response').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('idx_handle_expiry').on(table.xHandle, table.expiresAt),
]);

/**
 * Usage Tracking Table
 * Tracks premium image generation quota per user
 * Limit: 2 premium images per 24 hours per user
 */
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  userIdentifier: text('user_identifier').unique().notNull(),
  premiumImagesCount: integer('premium_images_count').default(0),
  lastResetAt: timestamp('last_reset_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type exports for use in API routes
export type XAccountCache = typeof xAccountCache.$inferSelect;
export type NewXAccountCache = typeof xAccountCache.$inferInsert;

export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;
