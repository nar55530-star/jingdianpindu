import { pgTable, serial, varchar, text, timestamp, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 系统表 - 禁止删除
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表 - 基于昵称的简单用户系统（无 Auth）
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

// 经典篇目表
export const articles = pgTable("articles", {
  id: serial().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 50 }).notNull(),
  description: text("description"),
  cover_key: varchar("cover_key", { length: 500 }),
  pdf_key: varchar("pdf_key", { length: 500 }),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("articles_sort_order_idx").on(table.sort_order),
]);

// 阅读打卡记录
export const readingRecords = pgTable("reading_records", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("reading_records_user_article_idx").on(table.user_id, table.article_id),
  index("reading_records_user_id_idx").on(table.user_id),
  index("reading_records_article_id_idx").on(table.article_id),
]);

// 心得帖子
export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes_count: integer("likes_count").default(0).notNull(),
  comments_count: integer("comments_count").default(0).notNull(),
  is_pinned: boolean("is_pinned").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("posts_user_id_idx").on(table.user_id),
  index("posts_article_id_idx").on(table.article_id),
  index("posts_created_at_idx").on(table.created_at),
  index("posts_is_pinned_idx").on(table.is_pinned),
]);

// 帖子评论
export const comments = pgTable("comments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  post_id: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("comments_post_id_idx").on(table.post_id),
  index("comments_user_id_idx").on(table.user_id),
]);

// 帖子点赞
export const postLikes = pgTable("post_likes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  post_id: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("post_likes_user_post_idx").on(table.user_id, table.post_id),
  index("post_likes_post_id_idx").on(table.post_id),
]);

// 金句墙
export const goldenQuotes = pgTable("golden_quotes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  quote: text("quote").notNull(),
  reflection: text("reflection"),
  likes_count: integer("likes_count").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("golden_quotes_user_id_idx").on(table.user_id),
  index("golden_quotes_article_id_idx").on(table.article_id),
  index("golden_quotes_created_at_idx").on(table.created_at),
]);

// 金句点赞
export const quoteLikes = pgTable("quote_likes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  quote_id: varchar("quote_id", { length: 36 }).notNull().references(() => goldenQuotes.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("quote_likes_user_quote_idx").on(table.user_id, table.quote_id),
  index("quote_likes_quote_id_idx").on(table.quote_id),
]);

// 用户收藏
export const favorites = pgTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  target_type: varchar("target_type", { length: 20 }).notNull(), // 'article' or 'quote'
  target_id: varchar("target_id", { length: 36 }).notNull(), // article_id (cast to string) or quote_id
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("favorites_user_target_idx").on(table.user_id, table.target_type, table.target_id),
  index("favorites_user_id_idx").on(table.user_id),
]);

// 公告
export const announcements = pgTable("announcements", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("announcements_created_at_idx").on(table.created_at),
]);
