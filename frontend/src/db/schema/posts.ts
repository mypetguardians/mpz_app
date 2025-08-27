import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { animals } from "./animals";

export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .default("temp_user")
    .references(() => user.id, { onDelete: "cascade" }),
  animalId: text("animal_id").references(() => animals.id, {
    onDelete: "set null",
  }),
  adoptionsId: text("adoptions_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentTags: text("content_tags", { mode: "json" }),
  // 게시글 공개 범위: public(전체공개) | center(센터공개)
  visibility: text("visibility", {
    enum: ["public", "center"],
  })
    .notNull()
    .default("public"),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const postImages = sqliteTable("post_images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const postTags = sqliteTable("post_tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagName: text("tag_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const postLikes = sqliteTable("post_likes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
