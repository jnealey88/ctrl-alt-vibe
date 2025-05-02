import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  projectUrl: text("project_url").notNull(),
  imageUrl: text("image_url").notNull(),
  vibeCodingTool: text("vibe_coding_tool"), // The AI tool used to create the project
  authorId: integer("author_id").references(() => users.id).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// AI Coding Tools table
export const codingTools = pgTable("coding_tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }).default("Other"),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project tags join table
export const projectTags = pgTable("project_tags", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comment replies
export const commentReplies = pgTable("comment_replies", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Likes
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  commentId: integer("comment_id").references(() => comments.id),
  replyId: integer("reply_id").references(() => commentReplies.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project shares
export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id), // Optional: track who shared (if logged in)
  platform: text("platform").notNull(), // e.g., 'twitter', 'facebook', 'linkedin', 'copy_link'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  comments: many(comments),
  commentReplies: many(commentReplies),
  likes: many(likes),
  bookmarks: many(bookmarks),
  shares: many(shares),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, { fields: [projects.authorId], references: [users.id] }),
  projectTags: many(projectTags),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  shares: many(shares),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  projectTags: many(projectTags),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, { fields: [projectTags.projectId], references: [projects.id] }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, { fields: [comments.projectId], references: [projects.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  replies: many(commentReplies),
  likes: many(likes),
}));

export const commentRepliesRelations = relations(commentReplies, ({ one, many }) => ({
  comment: one(comments, { fields: [commentReplies.commentId], references: [comments.id] }),
  author: one(users, { fields: [commentReplies.authorId], references: [users.id] }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  project: one(projects, { fields: [likes.projectId], references: [projects.id] }),
  comment: one(comments, { fields: [likes.commentId], references: [comments.id] }),
  reply: one(commentReplies, { fields: [likes.replyId], references: [commentReplies.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
  project: one(projects, { fields: [bookmarks.projectId], references: [projects.id] }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  user: one(users, { fields: [shares.userId], references: [users.id] }),
  project: one(projects, { fields: [shares.projectId], references: [projects.id] }),
}));

// Create validation schemas
export const userInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  bio: (schema) => schema.optional(),
  avatarUrl: (schema) => schema.optional(),
});

export const projectInsertSchema = createInsertSchema(projects, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: (schema) => schema.min(20, "Description must be at least 20 characters").max(500, "Description must be less than 500 characters"),
  longDescription: (schema) => schema.optional(),
  projectUrl: (schema) => schema.url("Please enter a valid URL"),
  imageUrl: (schema) => schema.url("Please enter a valid image URL"),
  vibeCodingTool: (schema) => schema.optional(),
});

export const commentInsertSchema = createInsertSchema(comments, {
  content: (schema) => schema.min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters"),
});

export const replyInsertSchema = createInsertSchema(commentReplies, {
  content: (schema) => schema.min(1, "Reply cannot be empty").max(1000, "Reply must be less than 1000 characters"),
});

export const codingToolInsertSchema = createInsertSchema(codingTools, {
  name: (schema) => schema.min(2, "Tool name must be at least 2 characters").max(50, "Tool name must be less than 50 characters"),
  category: (schema) => schema.optional(),
  isPopular: (schema) => schema.optional(),
});

export const shareInsertSchema = createInsertSchema(shares, {
  platform: (schema) => schema.min(2, "Platform name is required").max(50, "Platform name must be less than 50 characters"),
});

// Custom type for client-side project with tags as array
export type Project = {
  id: number;
  title: string;
  description: string;
  longDescription?: string;
  projectUrl: string;
  imageUrl: string;
  vibeCodingTool?: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  tags: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

// Comment type for client
export type Comment = {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  likesCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  replies?: CommentReply[];
  createdAt: string;
  updatedAt: string;
};

// Comment reply type for client
export type CommentReply = {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  likesCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt: string;
  updatedAt: string;
};

// Coding tool type for client
export type CodingTool = {
  id: number;
  name: string;
  category?: string;
  isPopular: boolean;
  createdAt: string;
};

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertProject = z.infer<typeof projectInsertSchema>;
export type InsertComment = z.infer<typeof commentInsertSchema>;
export type InsertReply = z.infer<typeof replyInsertSchema>;
export type InsertCodingTool = z.infer<typeof codingToolInsertSchema>;
export type InsertShare = z.infer<typeof shareInsertSchema>;
export type CodingToolFromDB = typeof codingTools.$inferSelect;
