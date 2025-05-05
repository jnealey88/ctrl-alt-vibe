import { db } from '@db';
import { 
  blogPosts, 
  blogPostTags, 
  blogTags, 
  blogCategories,
  blogPostInsertSchema,
  blogCategoryInsertSchema,
  blogTagInsertSchema,
  type BlogPost,
  type BlogCategory,
  type BlogTag,
  type InsertBlogPost,
  type InsertBlogCategory,
  type InsertBlogTag
} from '@shared/schema';
import { eq, and, desc, sql, asc, count, inArray, not, isNull, like } from 'drizzle-orm';
import { pagination } from '../config';

export class BlogService {
  /**
   * Get all blog categories
   */
  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.query.blogCategories.findMany({
      orderBy: (categories) => [asc(categories.name)]
    });
  }

  /**
   * Get a blog category by ID
   */
  async getBlogCategory(id: number): Promise<BlogCategory | null> {
    const category = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.id, id)
    });
    return category || null;
  }

  /**
   * Get a blog category by slug
   */
  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    const category = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.slug, slug)
    });
    return category || null;
  }

  /**
   * Create a new blog category
   */
  async createBlogCategory(categoryData: Omit<InsertBlogCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogCategory> {
    // Validate data against schema
    blogCategoryInsertSchema.parse({
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const [category] = await db.insert(blogCategories)
      .values({
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return category;
  }

  /**
   * Update a blog category
   */
  async updateBlogCategory(id: number, categoryData: Partial<Omit<InsertBlogCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BlogCategory | null> {
    // Check if category exists
    const existingCategory = await this.getBlogCategory(id);
    if (!existingCategory) return null;
    
    const [updatedCategory] = await db.update(blogCategories)
      .set({
        ...categoryData,
        updatedAt: new Date()
      })
      .where(eq(blogCategories.id, id))
      .returning();
    
    return updatedCategory;
  }

  /**
   * Delete a blog category
   */
  async deleteBlogCategory(id: number): Promise<boolean> {
    // Check if category exists
    const existingCategory = await this.getBlogCategory(id);
    if (!existingCategory) return false;
    
    // Reset category for all blog posts that use this category
    await db.update(blogPosts)
      .set({ categoryId: null })
      .where(eq(blogPosts.categoryId, id));
    
    // Delete the category
    const result = await db.delete(blogCategories)
      .where(eq(blogCategories.id, id));
    
    return true;
  }

  /**
   * Get all blog tags
   */
  async getBlogTags(): Promise<BlogTag[]> {
    return await db.query.blogTags.findMany({
      orderBy: (tags) => [asc(tags.name)]
    });
  }

  /**
   * Get a blog tag by ID
   */
  async getBlogTag(id: number): Promise<BlogTag | null> {
    const tag = await db.query.blogTags.findFirst({
      where: eq(blogTags.id, id)
    });
    return tag || null;
  }

  /**
   * Get a blog tag by slug
   */
  async getBlogTagBySlug(slug: string): Promise<BlogTag | null> {
    const tag = await db.query.blogTags.findFirst({
      where: eq(blogTags.slug, slug)
    });
    return tag || null;
  }

  /**
   * Create a new blog tag
   */
  async createBlogTag(tagData: Omit<InsertBlogTag, 'id' | 'createdAt'>): Promise<BlogTag> {
    // Validate data against schema
    blogTagInsertSchema.parse({
      ...tagData,
      createdAt: new Date()
    });
    
    const [tag] = await db.insert(blogTags)
      .values({
        ...tagData,
        createdAt: new Date()
      })
      .returning();
    
    return tag;
  }

  /**
   * Update a blog tag
   */
  async updateBlogTag(id: number, tagData: Partial<Omit<InsertBlogTag, 'id' | 'createdAt'>>): Promise<BlogTag | null> {
    // Check if tag exists
    const existingTag = await this.getBlogTag(id);
    if (!existingTag) return null;
    
    const [updatedTag] = await db.update(blogTags)
      .set(tagData)
      .where(eq(blogTags.id, id))
      .returning();
    
    return updatedTag;
  }

  /**
   * Delete a blog tag
   */
  async deleteBlogTag(id: number): Promise<boolean> {
    // Check if tag exists
    const existingTag = await this.getBlogTag(id);
    if (!existingTag) return false;
    
    // Delete all blog_post_tags entries that use this tag
    await db.delete(blogPostTags)
      .where(eq(blogPostTags.tagId, id));
    
    // Delete the tag
    await db.delete(blogTags)
      .where(eq(blogTags.id, id));
    
    return true;
  }

  /**
   * Get blog posts with pagination and filtering
   */
  async getBlogPosts({ 
    limit = pagination.defaultLimit, 
    offset = 0, 
    publishedOnly = true,
    categoryId,
    tagId,
    authorId,
    search
  }: { 
    limit?: number; 
    offset?: number; 
    publishedOnly?: boolean;
    categoryId?: number;
    tagId?: number;
    authorId?: number;
    search?: string;
  } = {}): Promise<{ posts: BlogPost[]; total: number }> {
    // Apply limits
    limit = Math.min(pagination.maxLimit, Math.max(1, limit));
    
    // Build the base query for filtering
    let query = db.select()
      .from(blogPosts)
      .leftJoin('users', eq(blogPosts.authorId, sql<number>`users.id`))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id));
    
    // Apply filters
    let whereConditions = [];
    
    if (publishedOnly) {
      whereConditions.push(eq(blogPosts.published, true));
    }
    
    if (categoryId) {
      whereConditions.push(eq(blogPosts.categoryId, categoryId));
    }
    
    if (authorId) {
      whereConditions.push(eq(blogPosts.authorId, authorId));
    }
    
    if (tagId) {
      // We need to join with blog_post_tags to filter by tag
      query = query.innerJoin(
        blogPostTags, 
        eq(blogPosts.id, blogPostTags.postId)
      ).where(eq(blogPostTags.tagId, tagId));
    }
    
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      whereConditions.push(
        or(
          like(sql`lower(${blogPosts.title})`, searchLower),
          like(sql`lower(${blogPosts.content})`, searchLower),
        )
      );
    }
    
    // Apply where conditions if any
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Create a query to count total matching posts
    const countQuery = db.select({ count: sql<number>`count(distinct ${blogPosts.id})` })
      .from(blogPosts)
      .where(query._entities[0].value); // Use the same where conditions
    
    // Apply ordering and pagination
    query = query
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Execute the queries
    const [posts, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    // Fetch tags for all posts
    const postIds = posts.map(post => post.blog_posts.id);
    const postTagResults = postIds.length > 0
      ? await db.select({
          postId: blogPostTags.postId,
          tagName: blogTags.name
        })
        .from(blogPostTags)
        .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
        .where(inArray(blogPostTags.postId, postIds))
      : [];
    
    // Group tags by post
    const tagsByPost = postTagResults.reduce((acc, { postId, tagName }) => {
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push(tagName);
      return acc;
    }, {} as Record<number, string[]>);
    
    // Format the posts with complete info
    const formattedPosts = posts.map(row => ({
      id: row.blog_posts.id,
      title: row.blog_posts.title,
      slug: row.blog_posts.slug,
      excerpt: row.blog_posts.excerpt,
      content: row.blog_posts.content,
      imageUrl: row.blog_posts.imageUrl,
      published: row.blog_posts.published,
      viewCount: row.blog_posts.viewCount,
      createdAt: row.blog_posts.createdAt.toISOString(),
      updatedAt: row.blog_posts.updatedAt.toISOString(),
      author: {
        id: row.blog_posts.authorId,
        username: row.users?.username,
        avatarUrl: row.users?.avatar_url
      },
      category: row.blog_categories ? {
        id: row.blog_categories.id,
        name: row.blog_categories.name,
        slug: row.blog_categories.slug
      } : null,
      tags: tagsByPost[row.blog_posts.id] || []
    }));
    
    return {
      posts: formattedPosts,
      total: countResult[0].count
    };
  }

  /**
   * Get a blog post by ID
   */
  async getBlogPost(id: number): Promise<BlogPost | null> {
    // This is a simplified version - in a complete implementation, we would
    // reuse the query-building logic from getBlogPosts to avoid duplication
    
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        category: true
      }
    });
    
    if (!post) return null;
    
    // Get tags for this post
    const tags = await db.select({
      name: blogTags.name
    })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
    .where(eq(blogPostTags.postId, id));
    
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      tags: tags.map(t => t.name)
    };
  }
  
  // Additional methods would be implemented here
}
