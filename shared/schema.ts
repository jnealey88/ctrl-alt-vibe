import { pgTable, text, serial, integer, boolean, timestamp, varchar, index, unique, json } from "drizzle-orm/pg-core";
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
  role: text("role").default("user").notNull(), // Available roles: 'admin', 'user'
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
  isPrivate: boolean("is_private").default(false).notNull(), // Controls project visibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Add indexes for commonly queried columns
    titleIdx: index("title_idx").on(table.title), // For search by title
    authorIdx: index("author_idx").on(table.authorId), // For filtering by author
    featuredIdx: index("featured_idx").on(table.featured), // For featured projects page
    createdAtIdx: index("created_at_idx").on(table.createdAt), // For sorting by date
    viewsCountIdx: index("views_count_idx").on(table.viewsCount), // For trending projects
  };
});

// Project views table for tracking monthly views
export const projectViews = pgTable("project_views", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  month: integer("month").notNull(), // 1-12 for January-December
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for finding views by project
    projectIdIdx: index("project_views_project_id_idx").on(table.projectId),
    // Unique constraint for one record per project per month
    monthYearProjectIdx: unique("project_views_month_year_project_idx").on(table.projectId, table.month, table.year),
    // Index for querying based on time period
    yearMonthIdx: index("project_views_year_month_idx").on(table.year, table.month),
  };
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
}, (table) => {
  return {
    // Case-insensitive index for tag name lookups
    nameIdx: index("tags_name_idx").on(table.name),
  };
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
}, (table) => {
  return {
    // Indexing both columns for efficient tag filtering
    projectIdIdx: index("project_id_idx").on(table.projectId),
    tagIdIdx: index("tag_id_idx").on(table.tagId),
    // Composite index for when we query by both
    projectTagIdx: index("project_tag_idx").on(table.projectId, table.tagId),
  };
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    projectIdIdx: index("comments_project_id_idx").on(table.projectId), // For fetching project comments
    authorIdIdx: index("comments_author_id_idx").on(table.authorId), // For user's comment history
    createdAtIdx: index("comments_created_at_idx").on(table.createdAt), // For sorting/pagination
  };
});

// Comment replies
export const commentReplies = pgTable("comment_replies", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    commentIdIdx: index("comment_replies_comment_id_idx").on(table.commentId), // For comment-reply tree
    authorIdIdx: index("comment_replies_author_id_idx").on(table.authorId), // For user's replies history
    createdAtIdx: index("comment_replies_created_at_idx").on(table.createdAt), // For sorting
  };
});

// Likes
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  commentId: integer("comment_id").references(() => comments.id),
  replyId: integer("reply_id").references(() => commentReplies.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    projectIdIdx: index("likes_project_id_idx").on(table.projectId),
    commentIdIdx: index("likes_comment_id_idx").on(table.commentId),
    replyIdIdx: index("likes_reply_id_idx").on(table.replyId),
    userIdIdx: index("likes_user_id_idx").on(table.userId),
    // Composite indexes for common query patterns
    userProjectIdx: index("likes_user_project_idx").on(table.userId, table.projectId),
  };
});

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    projectIdIdx: index("bookmarks_project_id_idx").on(table.projectId),
    userIdIdx: index("bookmarks_user_id_idx").on(table.userId),
    // Composite index for when we check if a user has bookmarked a project
    userProjectIdx: index("bookmarks_user_project_idx").on(table.userId, table.projectId),
  };
});

// Project gallery images
export const projectGallery = pgTable("project_gallery", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    projectIdIdx: index("project_gallery_project_id_idx").on(table.projectId),
    displayOrderIdx: index("project_gallery_display_order_idx").on(table.displayOrder),
  };
});

// Project shares
export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id), // Optional: track who shared (if logged in)
  platform: text("platform").notNull(), // e.g., 'twitter', 'facebook', 'linkedin', 'copy_link'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    projectIdIdx: index("shares_project_id_idx").on(table.projectId),
    userIdIdx: index("shares_user_id_idx").on(table.userId),
    // Index for analytics by platform
    platformIdx: index("shares_platform_idx").on(table.platform),
  };
});

// Project AI evaluations
export const projectEvaluations = pgTable("project_evaluations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  // Store the complete evaluation as a JSON object
  evaluation: json("evaluation").notNull(),
  // Key fields for quick access
  fitScore: integer("fit_score").default(0).notNull(), // 0-100 score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing for faster queries
    projectIdIdx: index("project_evaluations_project_id_idx").on(table.projectId),
    // Make sure we only have one evaluation per project (can be updated)
    projectUniqueIdx: unique("project_evaluations_project_unique_idx").on(table.projectId),
    // Index for querying by fit score
    fitScoreIdx: index("project_evaluations_fit_score_idx").on(table.fitScore),
  };
});

// Blog categories schema
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: index("blog_categories_name_idx").on(table.name),
    slugIdx: index("blog_categories_slug_idx").on(table.slug),
  };
});

// Blog posts schema
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  summary: text("summary").notNull(),
  tldr: text("tldr"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  published: boolean("published").default(false).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => blogCategories.id),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
}, (table) => {
  return {
    titleIdx: index("blog_posts_title_idx").on(table.title),
    slugIdx: index("blog_posts_slug_idx").on(table.slug),
    authorIdx: index("blog_posts_author_idx").on(table.authorId),
    categoryIdx: index("blog_posts_category_idx").on(table.categoryId),
    publishedIdx: index("blog_posts_published_idx").on(table.published),
    createdAtIdx: index("blog_posts_created_at_idx").on(table.createdAt),
    publishedAtIdx: index("blog_posts_published_at_idx").on(table.publishedAt),
  };
});

// Blog tags schema
export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: index("blog_tags_name_idx").on(table.name),
    slugIdx: index("blog_tags_slug_idx").on(table.slug),
  };
});

// Blog post tags relationship
export const blogPostTags = pgTable("blog_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  tagId: integer("tag_id").references(() => blogTags.id).notNull(),
}, (table) => {
  return {
    postIdIdx: index("blog_post_tags_post_id_idx").on(table.postId),
    tagIdIdx: index("blog_post_tags_tag_id_idx").on(table.tagId),
    // Composite index for when we query by both
    postTagIdx: index("blog_post_tags_unique_idx").on(table.postId, table.tagId),
  };
});

// Unique constraint is handled within the table definition using (t) => ({ ... })

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  comments: many(comments),
  commentReplies: many(commentReplies),
  likes: many(likes),
  bookmarks: many(bookmarks),
  shares: many(shares),
  blogPosts: many(blogPosts),
}));

// Blog relations
export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  tags: many(blogPostTags),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, { fields: [projects.authorId], references: [users.id] }),
  projectTags: many(projectTags),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  shares: many(shares),
  views: many(projectViews),
  galleryImages: many(projectGallery),
  evaluation: many(projectEvaluations), // New relation to project evaluations
}));

export const projectGalleryRelations = relations(projectGallery, ({ one }) => ({
  project: one(projects, { fields: [projectGallery.projectId], references: [projects.id] }),
}));

export const projectViewsRelations = relations(projectViews, ({ one }) => ({
  project: one(projects, { fields: [projectViews.projectId], references: [projects.id] }),
}));

export const projectEvaluationsRelations = relations(projectEvaluations, ({ one }) => ({
  project: one(projects, { fields: [projectEvaluations.projectId], references: [projects.id] }),
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
  role: (schema) => schema.optional(),
});

export const projectInsertSchema = createInsertSchema(projects, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: (schema) => schema.min(20, "Description must be at least 20 characters").max(500, "Description must be less than 500 characters"),
  longDescription: (schema) => schema.optional(),
  projectUrl: (schema) => schema.url("Please enter a valid URL"),
  imageUrl: (schema) => schema.url("Please enter a valid image URL"),
  vibeCodingTool: (schema) => schema.optional(),
  isPrivate: (schema) => schema.optional(),
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

export const projectGalleryInsertSchema = createInsertSchema(projectGallery, {
  // We're using relative paths like /uploads/image.jpg, not full URLs
  imageUrl: (schema) => schema.min(1, "Image path is required"),
  caption: (schema) => schema.optional(),
  displayOrder: (schema) => schema.optional(),
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
  galleryImages?: ProjectGalleryImage[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  featured: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  evaluation?: {
    id: number;
    fitScore: number;
    evaluation: ProjectEvaluation['evaluation'];
    createdAt: string;
    updatedAt: string;
  };
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



export type User = typeof users.$inferSelect & {
  role: string; // Include the role in the User type
};
export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertProject = z.infer<typeof projectInsertSchema>;
export type InsertComment = z.infer<typeof commentInsertSchema>;
export type InsertReply = z.infer<typeof replyInsertSchema>;
export type InsertCodingTool = z.infer<typeof codingToolInsertSchema>;
export type InsertShare = z.infer<typeof shareInsertSchema>;
export type InsertProjectGallery = z.infer<typeof projectGalleryInsertSchema>;
export type ProjectGalleryImage = typeof projectGallery.$inferSelect;
export type CodingToolFromDB = typeof codingTools.$inferSelect;

// Blog schemas
export const blogPostInsertSchema = createInsertSchema(blogPosts, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  summary: (schema) => schema.min(10, "Summary must be at least 10 characters"),
  content: (schema) => schema.min(50, "Content must be at least 50 characters"),
  tldr: (schema) => schema.optional(),
});

export const blogCategoryInsertSchema = createInsertSchema(blogCategories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export const blogTagInsertSchema = createInsertSchema(blogTags, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export type BlogPost = typeof blogPosts.$inferSelect & {
  author: {
    id: number,
    username: string,
    avatarUrl?: string
  },
  category: {
    id: number,
    name: string,
    slug: string
  } | null,
  tags: string[]
};

export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogTag = typeof blogTags.$inferSelect;

export type InsertBlogPost = z.infer<typeof blogPostInsertSchema>;
export type InsertBlogCategory = z.infer<typeof blogCategoryInsertSchema>;
export type InsertBlogTag = z.infer<typeof blogTagInsertSchema>;

// User skills table
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text("category").notNull(),
  skill: text("skill").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activity types
export const activityTypes = {
  PROJECT_CREATED: "project_created",
  PROJECT_LIKED: "project_liked",
  COMMENT_ADDED: "comment_added",
  REPLY_ADDED: "reply_added",
} as const;

// Notification types
export const notificationTypes = {
  NEW_COMMENT: "new_comment",
  NEW_REPLY: "new_reply",
  PROJECT_LIKED: "project_liked",
  COMMENT_LIKED: "comment_liked",
  REPLY_LIKED: "reply_liked"
} as const;

// User activity table
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  targetId: integer("target_id").notNull(), // ID of project, comment, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  actorId: integer("actorId").references(() => users.id), // User who triggered the notification
  projectId: integer("projectId").references(() => projects.id),
  commentId: integer("commentId").references(() => comments.id),
  replyId: integer("replyId").references(() => commentReplies.id),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    readIdx: index("notifications_read_idx").on(table.read),
  };
});

// User skills and activity relations
export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { fields: [userSkills.userId], references: [users.id] }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, { fields: [userActivity.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id] }),
  project: one(projects, { fields: [notifications.projectId], references: [projects.id] }),
  comment: one(comments, { fields: [notifications.commentId], references: [comments.id] }),
  reply: one(commentReplies, { fields: [notifications.replyId], references: [commentReplies.id] }),
}));

// Complete version of usersRelations including skills and activities
export const extendedUsersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  comments: many(comments),
  commentReplies: many(commentReplies),
  likes: many(likes),
  bookmarks: many(bookmarks),
  shares: many(shares),
  blogPosts: many(blogPosts),
  skills: many(userSkills),
  activities: many(userActivity),
  notifications: many(notifications, { relationName: "user" }),
  notificationsAsActor: many(notifications, { relationName: "actor" }),
}));

// User skills schema and types
export const userSkillInsertSchema = createInsertSchema(userSkills);
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof userSkillInsertSchema>;
export type UserActivity = typeof userActivity.$inferSelect;

// Project views schema and types
export const projectViewInsertSchema = createInsertSchema(projectViews);
export type ProjectView = typeof projectViews.$inferSelect;
export type InsertProjectView = z.infer<typeof projectViewInsertSchema>;

// Project evaluations schema and types
export const projectEvaluationInsertSchema = createInsertSchema(projectEvaluations);
export type ProjectEvaluation = typeof projectEvaluations.$inferSelect & {
  evaluation: {
    marketFitAnalysis: {
      strengths: string[];
      weaknesses: string[];
      demandPotential: string;
    };
    targetAudience: {
      demographic: string;
      psychographic: string;
    };
    fitScore: number; // 0-100
    fitScoreExplanation: string;
    businessPlan: {
      revenueModel: string;
      goToMarketStrategy: string;
      keyMilestones: string[];
      resourcesNeeded: string[];
    };
    valueProposition: string;
    riskAssessment: {
      risks: {
        type: string;
        description: string;
        mitigation: string;
      }[];
    };
    technicalFeasibility: {
      stack: string;
      dependencies: string[];
      complexity: string;
    };
    regulatoryConsiderations: string[];
    partnershipOpportunities: string[];
    competitiveLandscape: {
      competitors: {
        name: string;
        description: string;
      }[];
      differentiationPoints: string[];
    };
  };
};
export type InsertProjectEvaluation = z.infer<typeof projectEvaluationInsertSchema>;

// Notifications schema and types
export const notificationInsertSchema = createInsertSchema(notifications);
export type Notification = typeof notifications.$inferSelect & {
  actor?: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  project?: {
    id: number;
    title: string;
  };
  comment?: {
    id: number;
    content: string;
  };
  reply?: {
    id: number;
    content: string;
  };
};
export type InsertNotification = z.infer<typeof notificationInsertSchema>;
