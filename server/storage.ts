import { db } from "@db";
import { eq, and, desc, sql, asc, count, isNull, like, inArray, not, or } from "drizzle-orm";
import {
  users,
  projects,
  tags,
  projectTags,
  comments,
  commentReplies,
  likes,
  bookmarks,
  codingTools,
  shares,
  blogPosts,
  blogCategories,
  blogTags,
  blogPostTags,
  userSkills,
  userActivity,
  projectViews,
  notifications,
  notificationTypes,
  projectGallery,
  projectEvaluations,
} from "@shared/schema";
import type { 
  Project, 
  Comment, 
  CommentReply, 
  InsertProject, 
  InsertComment, 
  InsertReply,
  CodingTool,
  InsertCodingTool,
  InsertShare,
  BlogPost,
  BlogCategory,
  BlogTag,
  InsertBlogPost,
  InsertBlogCategory,
  InsertBlogTag,
  ProjectView,
  InsertProjectView,
  Notification,
  InsertNotification,
  ProjectGalleryImage,
  InsertProjectGallery,
  ProjectEvaluation,
  InsertProjectEvaluation
} from "@shared/schema";

// Helper function to apply proper casing to tags
const getProperCasedTag = (tagName: string): string => {
  // Define a list of predefined tags with proper casing
  const predefinedTags = [
    "AI Tools", "Analytics", "Art", "Business", 
    "Chatbots", "Code", "Creative", "Data Visualization", 
    "Development", "Education", "GPT Models", "Image Generation", 
    "Machine Learning", "Natural Language Processing", "Productivity", "Tools",
    "Collaboration", "Content Creation", "Developer Tools", 
    "Finance", "Gaming", "Health", "Lifestyle", 
    "Social", "Utilities", "Web Development", "Mobile", 
    "Design", "Communication"
  ];
  
  // Find a match in the predefined list (case-insensitive)
  const match = predefinedTags.find(
    predefined => predefined.toLowerCase() === tagName.toLowerCase()
  );
  
  // Return the properly cased version or the original if no match
  return match || tagName;
};

import { activityTypes, type UserSkill } from "@shared/schema";

export const storage = {
  // Blog methods
  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.query.blogCategories.findMany({
      orderBy: (categories) => [asc(categories.name)]
    });
  },

  async getBlogCategory(id: number): Promise<BlogCategory | null> {
    const category = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.id, id)
    });
    return category || null;
  },

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    const category = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.slug, slug)
    });
    return category || null;
  },

  async createBlogCategory(categoryData: Omit<InsertBlogCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogCategory> {
    const [category] = await db.insert(blogCategories).values({
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return category;
  },

  async updateBlogCategory(id: number, categoryData: Partial<Omit<InsertBlogCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BlogCategory | null> {
    const [category] = await db.update(blogCategories)
      .set({
        ...categoryData,
        updatedAt: new Date()
      })
      .where(eq(blogCategories.id, id))
      .returning();
    return category || null;
  },

  async deleteBlogCategory(id: number): Promise<boolean> {
    try {
      await db.delete(blogCategories).where(eq(blogCategories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog category:', error);
      return false;
    }
  },

  async getBlogTags(): Promise<BlogTag[]> {
    return await db.query.blogTags.findMany({
      orderBy: (tags) => [asc(tags.name)]
    });
  },

  async getBlogTag(id: number): Promise<BlogTag | null> {
    const tag = await db.query.blogTags.findFirst({
      where: eq(blogTags.id, id)
    });
    return tag || null;
  },

  async getBlogTagBySlug(slug: string): Promise<BlogTag | null> {
    const tag = await db.query.blogTags.findFirst({
      where: eq(blogTags.slug, slug)
    });
    return tag || null;
  },

  async createBlogTag(tagData: Omit<InsertBlogTag, 'id' | 'createdAt'>): Promise<BlogTag> {
    const [tag] = await db.insert(blogTags).values({
      ...tagData,
      createdAt: new Date()
    }).returning();
    return tag;
  },

  async updateBlogTag(id: number, tagData: Partial<Omit<InsertBlogTag, 'id' | 'createdAt'>>): Promise<BlogTag | null> {
    const [tag] = await db.update(blogTags)
      .set(tagData)
      .where(eq(blogTags.id, id))
      .returning();
    return tag || null;
  },

  async deleteBlogTag(id: number): Promise<boolean> {
    try {
      await db.delete(blogTags).where(eq(blogTags.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog tag:', error);
      return false;
    }
  },

  async getBlogPosts(options: { 
    limit?: number; 
    offset?: number; 
    publishedOnly?: boolean;
    categoryId?: number;
    tagId?: number;
    authorId?: number;
    search?: string;
  } = {}): Promise<{ posts: BlogPost[]; total: number }> {
    const { limit = 10, offset = 0, publishedOnly = true, categoryId, tagId, authorId, search } = options;
    
    // Build conditions array for query
    const conditions: any[] = [];
    
    if (publishedOnly) {
      conditions.push(eq(blogPosts.published, true));
    }
    
    if (categoryId) {
      conditions.push(eq(blogPosts.categoryId, categoryId));
    }
    
    if (authorId) {
      conditions.push(eq(blogPosts.authorId, authorId));
    }
    
    // Add search condition if provided
    if (search) {
      conditions.push(
        or(
          sql`${blogPosts.title} ILIKE ${`%${search}%`}`, 
          sql`${blogPosts.summary} ILIKE ${`%${search}%`}`,
          sql`${blogPosts.content} ILIKE ${`%${search}%`}`
        )
      );
    }
    
    // Execute query with all conditions
    let postResults;
    if (tagId) {
      // For tag filtering, we need to do a join query
      const joinResults = await db.select({
        post: {
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          summary: blogPosts.summary,
          content: blogPosts.content,
          featuredImage: blogPosts.featuredImage,
          published: blogPosts.published,
          authorId: blogPosts.authorId,
          categoryId: blogPosts.categoryId,
          viewCount: blogPosts.viewCount,
          createdAt: blogPosts.createdAt,
          updatedAt: blogPosts.updatedAt,
          publishedAt: blogPosts.publishedAt
        },
        blogPostTag: blogPostTags
      })
      .from(blogPosts)
      .innerJoin(blogPostTags, eq(blogPosts.id, blogPostTags.postId))
      .where(and(eq(blogPostTags.tagId, tagId), ...(conditions.length ? conditions : [])))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(blogPosts.createdAt));
      
      // Extract just the post data
      postResults = joinResults.map(result => result.post);
    } else {
      // Standard query without tag filtering
      postResults = await db.select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        summary: blogPosts.summary,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        published: blogPosts.published,
        authorId: blogPosts.authorId,
        categoryId: blogPosts.categoryId,
        viewCount: blogPosts.viewCount,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        publishedAt: blogPosts.publishedAt
      })
        .from(blogPosts)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.createdAt));
    }
    
    // Get the total count for pagination
    let totalCount;
    if (tagId) {
      const taggedPostsCount = await db.select({ count: count() })
        .from(blogPosts)
        .innerJoin(blogPostTags, eq(blogPosts.id, blogPostTags.postId))
        .where(and(eq(blogPostTags.tagId, tagId), ...(conditions.length ? conditions : [])));
      totalCount = Number(taggedPostsCount[0]?.count || 0);
    } else {
      const countResult = await db.select({ count: count() })
        .from(blogPosts)
        .where(conditions.length ? and(...conditions) : undefined);
      totalCount = Number(countResult[0]?.count || 0);
    }

    // Now for each post, get author, category, and tags
    const enhancedPosts = await Promise.all(postResults.map(async (post) => {
      const author = await db.query.users.findFirst({
        where: eq(users.id, post.authorId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true
        }
      });

      let category = null;
      if (post.categoryId) {
        category = await db.query.blogCategories.findFirst({
          where: eq(blogCategories.id, post.categoryId),
        });
      }

      // Get tags for this post
      const postTagResults = await db.select({
        blogPostTag: blogPostTags,
        tag: blogTags
      })
        .from(blogPostTags)
        .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
        .where(eq(blogPostTags.postId, post.id));

      const tags = postTagResults.map(result => result.tag.name);

      return {
        ...post,
        author: author || { id: 0, username: 'Unknown' },
        category: category ? { id: category.id, name: category.name, slug: category.slug } : undefined,
        tags
      } as BlogPost;
    }));

    return { posts: enhancedPosts, total: totalCount };
  },

  async getBlogPost(id: number): Promise<BlogPost | null> {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      columns: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        tldr: true,
        content: true,
        featuredImage: true,
        published: true,
        authorId: true,
        categoryId: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true
      }
    });

    if (!post) return null;

    // Get author
    const author = await db.query.users.findFirst({
      where: eq(users.id, post.authorId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true
      }
    });

    // Get category if exists
    let category = null;
    if (post.categoryId) {
      category = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, post.categoryId)
      });
    }

    // Get tags
    const postTagResults = await db.select({
      blogPostTag: blogPostTags,
      tag: blogTags
    })
      .from(blogPostTags)
      .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, post.id));

    const tags = postTagResults.map(result => result.tag.name);

    return {
      ...post,
      author: author ? { 
        id: author.id, 
        username: author.username, 
        avatarUrl: author.avatarUrl ? author.avatarUrl : undefined 
      } : { id: 0, username: 'Unknown' },
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      tags
    };
  },

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
      columns: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        tldr: true,
        content: true,
        featuredImage: true,
        published: true,
        authorId: true,
        categoryId: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true
      }
    });

    if (!post) return null;

    // Get author
    const author = await db.query.users.findFirst({
      where: eq(users.id, post.authorId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true
      }
    });

    // Get category if exists
    let category = null;
    if (post.categoryId) {
      category = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, post.categoryId)
      });
    }

    // Get tags
    const postTagResults = await db.select({
      blogPostTag: blogPostTags,
      tag: blogTags
    })
      .from(blogPostTags)
      .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, post.id));

    const tags = postTagResults.map(result => result.tag.name);

    return {
      ...post,
      author: author ? { 
        id: author.id, 
        username: author.username, 
        avatarUrl: author.avatarUrl ? author.avatarUrl : undefined 
      } : { id: 0, username: 'Unknown' },
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      tags
    };
  },

  async incrementBlogPostViews(id: number): Promise<void> {
    await db.update(blogPosts)
      .set({
        viewCount: sql`${blogPosts.viewCount} + 1`
      })
      .where(eq(blogPosts.id, id));
  },

  async createBlogPost(postData: Omit<InsertBlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>, tagIds: number[] = []): Promise<BlogPost> {
    // Check if slug already exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, postData.slug)
    });

    if (existingPost) {
      throw new Error('A post with this slug already exists');
    }

    // Create the post
    const [post] = await db.insert(blogPosts).values({
      ...postData,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: postData.published ? new Date() : null
    }).returning();

    // Add tags if any
    if (tagIds.length > 0) {
      await Promise.all(tagIds.map(tagId => 
        db.insert(blogPostTags).values({
          postId: post.id,
          tagId
        })
      ));
    }

    // Return the full post with author, category, tags
    return await this.getBlogPost(post.id) as BlogPost;
  },

  async updateBlogPost(id: number, postData: Partial<Omit<InsertBlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>>, tagIds?: number[]): Promise<BlogPost | null> {
    // Check if slug change and if it already exists
    if (postData.slug) {
      const existingPost = await db.query.blogPosts.findFirst({
        where: and(
          eq(blogPosts.slug, postData.slug),
          not(eq(blogPosts.id, id))
        )
      });

      if (existingPost) {
        throw new Error('A post with this slug already exists');
      }
    }

    // Check if publishing status changed to published
    const currentPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id)
    });

    if (!currentPost) {
      return null;
    }

    const isPublishingNow = !currentPost.published && postData.published;

    // Update the post
    const [post] = await db.update(blogPosts)
      .set({
        ...postData,
        updatedAt: new Date(),
        publishedAt: isPublishingNow ? new Date() : currentPost.publishedAt
      })
      .where(eq(blogPosts.id, id))
      .returning();

    // If tagIds provided, update tags
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      
      // Add new tags
      if (tagIds.length > 0) {
        await Promise.all(tagIds.map(tagId => 
          db.insert(blogPostTags).values({
            postId: id,
            tagId
          })
        ));
      }
    }

    // Return the full post with author, category, tags
    return post ? await this.getBlogPost(post.id) : null;
  },

  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      // Delete post tags first due to foreign key constraints
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      // Delete the post
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  },

  // Projects

  async getProjects({ 
    page = 1, 
    limit = 6, 
    tag = "", 
    search = "", 
    sort = "trending", 
    user = "",
    currentUserId = 0 // Add param for logged-in user
  }): Promise<{ projects: Project[]; hasMore: boolean; total: number }> {
    const offset = (page - 1) * limit;
    
    // Get user ID if username is provided
    let userId: number | undefined;
    if (user) {
      const userRecord = await db.query.users.findFirst({
        where: eq(users.username, user)
      });
      userId = userRecord?.id;
      if (!userId) {
        return { projects: [], hasMore: false, total: 0 };
      }
    }
    
    // Build query conditions
    let conditions = [];
    
    // Only show public projects unless user is viewing their own projects
    if (!userId || userId !== currentUserId) {
      conditions.push(
        or(
          eq(projects.isPrivate, false),
          // Also include private projects if the current user is the author
          currentUserId > 0 ? eq(projects.authorId, currentUserId) : undefined
        )
      );
    }
    
    // Tag filter
    if (tag) {
      const tagRecord = await db.query.tags.findFirst({
        where: eq(tags.name, tag)
      });
      
      if (tagRecord) {
        // Get project IDs that have this tag
        const taggedProjects = await db.query.projectTags.findMany({
          where: eq(projectTags.tagId, tagRecord.id),
          columns: {
            projectId: true
          }
        });
        
        const projectIds = taggedProjects.map(pt => pt.projectId);
        if (projectIds.length > 0) {
          conditions.push(inArray(projects.id, projectIds));
        } else {
          return { projects: [], hasMore: false, total: 0 };
        }
      } else {
        return { projects: [], hasMore: false, total: 0 };
      }
    }
    
    // Search filter
    if (search) {
      conditions.push(
        sql`(${projects.title} ILIKE ${`%${search}%`} OR ${projects.description} ILIKE ${`%${search}%`})`
      );
    }
    
    // User filter
    if (userId) {
      conditions.push(eq(projects.authorId, userId));
    }
    
    // Count total for pagination
    const totalResults = await db.select({ count: count() }).from(projects)
      .where(conditions.length ? and(...conditions) : undefined);
    
    const total = Number(totalResults[0]?.count || 0);
    
    // Get projects
    let sortOptions = {};
    switch (sort) {
      case "latest":
        sortOptions = { orderBy: [desc(projects.createdAt)] };
        break;
      case "popular":
        sortOptions = { orderBy: [desc(projects.viewsCount)] };
        break;
      case "featured":
        conditions.push(eq(projects.featured, true));
        sortOptions = { orderBy: [desc(projects.createdAt)] };
        break;
      default: // trending
        // For trending, we'll retrieve monthly views first, then do custom sorting in JavaScript
        // This is necessary because we need to join data from projectViews table
        
        // Get sort data normally now; we'll handle custom sorting after the query
        sortOptions = { 
          orderBy: [desc(projects.createdAt)]
        };
        
        // We'll apply the trending algorithm after query using data from projectViews
    }
    
    let projectsResults = await db.query.projects.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      limit,
      offset,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      ...sortOptions
    });
    
    // Convert to client-side Project type
    const projectsWithDetails = await Promise.all(
      projectsResults.map(async (project) => {
        // Get tags for this project
        const projectTagsResult = await db.query.projectTags.findMany({
          where: eq(projectTags.projectId, project.id),
          with: {
            tag: true
          }
        });
        const tagNames = projectTagsResult.map(pt => pt.tag.name);
        
        // Get likes count
        const likesResult = await db.select({ count: count() })
          .from(likes)
          .where(and(
            eq(likes.projectId, project.id),
            isNull(likes.commentId),
            isNull(likes.replyId)
          ));
        const likesCount = Number(likesResult[0]?.count || 0);
        
        // Check if current user has liked this project
        const userLike = await db.query.likes.findFirst({
          where: and(
            eq(likes.projectId, project.id),
            eq(likes.userId, currentUserId),
            isNull(likes.commentId),
            isNull(likes.replyId)
          )
        });
        
        // Get comments count
        const commentsResult = await db.select({ count: count() })
          .from(comments)
          .where(eq(comments.projectId, project.id));
        const commentsCount = Number(commentsResult[0]?.count || 0);
        
        // Check if current user has bookmarked this project
        const userBookmark = await db.query.bookmarks.findFirst({
          where: and(
            eq(bookmarks.projectId, project.id),
            eq(bookmarks.userId, currentUserId)
          )
        });
        
        return {
          ...project,
          tags: tagNames,
          likesCount,
          commentsCount,
          isLiked: !!userLike,
          isBookmarked: !!userBookmark,
          // Convert Date objects to strings
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString()
        } as Project;
      })
    );
    
    // Apply special trending sort for trending option
    if (sort === "trending") {
      // Get current date info for the current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Get monthly views for all projects
      const monthlyViewProjects = await db.select({
        projectId: projectViews.projectId,
        monthlyViews: projectViews.viewsCount
      })
      .from(projectViews)
      .where(and(
        eq(projectViews.month, currentMonth),
        eq(projectViews.year, currentYear)
      ));
      
      // Create a map of project IDs to their monthly views
      const projectMonthlyViews = new Map<number, number>();
      monthlyViewProjects.forEach(pv => {
        projectMonthlyViews.set(pv.projectId, pv.monthlyViews);
      });
      
      // Sort projects based on trending algorithm (monthly views and recency)
      projectsWithDetails.sort((a, b) => {
        const aMonthlyViews = projectMonthlyViews.get(a.id) || 0;
        const bMonthlyViews = projectMonthlyViews.get(b.id) || 0;
        
        // Parse dates back from ISO strings
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        
        // Calculate trending score: 70% monthly views + 30% recency
        const aScore = aMonthlyViews * 0.7 + 
          ((aDate.getTime() - now.getTime() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000) * 3);
        const bScore = bMonthlyViews * 0.7 + 
          ((bDate.getTime() - now.getTime() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000) * 3);
        
        return bScore - aScore; // Descending order
      });
    }
    
    return {
      projects: projectsWithDetails,
      hasMore: offset + projectsWithDetails.length < total,
      total
    };
  },
  
  async getFeaturedProject(currentUserId: number = 0): Promise<Project | null> {
    // Only show public projects or projects owned by the current user
    const featuredProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.featured, true),
        or(
          eq(projects.isPrivate, false),
          currentUserId > 0 ? eq(projects.authorId, currentUserId) : undefined
        )
      ),
      orderBy: [desc(projects.createdAt)],
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
    
    if (!featuredProject) return null;
    
    // Get tags for this project
    const projectTagsResult = await db.query.projectTags.findMany({
      where: eq(projectTags.projectId, featuredProject.id),
      with: {
        tag: true
      }
    });
    const tagNames = projectTagsResult.map(pt => pt.tag.name);
    
    // Get likes count
    const likesResult = await db.select({ count: count() })
      .from(likes)
      .where(and(
        eq(likes.projectId, featuredProject.id),
        isNull(likes.commentId),
        isNull(likes.replyId)
      ));
    const likesCount = Number(likesResult[0]?.count || 0);
    
    // Check if current user has liked this project
    const userLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.projectId, featuredProject.id),
        eq(likes.userId, currentUserId),
        isNull(likes.commentId),
        isNull(likes.replyId)
      )
    });
    
    // Get comments count
    const commentsResult = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.projectId, featuredProject.id));
    const commentsCount = Number(commentsResult[0]?.count || 0);
    
    // Check if current user has bookmarked this project
    const userBookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.projectId, featuredProject.id),
        eq(bookmarks.userId, currentUserId)
      )
    });
    
    return {
      ...featuredProject,
      tags: tagNames,
      likesCount,
      commentsCount,
      isLiked: !!userLike,
      isBookmarked: !!userBookmark,
      // Convert Date to string
      createdAt: featuredProject.createdAt.toISOString(),
      updatedAt: featuredProject.updatedAt.toISOString()
    } as Project;
  },
  
  async getTrendingProjects(limit: number = 4, currentUserId: number = 0): Promise<Project[]> {
    // Get current date info for the current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get projects using our trending algorithm based on monthly views
    // Apply privacy filter: only show public projects unless user is the author
    
    // First, find projects with views in the current month
    const monthlyViewProjects = await db.select({
      projectId: projectViews.projectId,
      monthlyViews: projectViews.viewsCount
    })
    .from(projectViews)
    .where(and(
      eq(projectViews.month, currentMonth),
      eq(projectViews.year, currentYear)
    ));
    
    // Create a map of project IDs to their monthly views
    const projectMonthlyViews = new Map<number, number>();
    monthlyViewProjects.forEach(pv => {
      projectMonthlyViews.set(pv.projectId, pv.monthlyViews);
    });
    
    // Get all projects
    const projectsResults = await db.query.projects.findMany({
      where: or(
        eq(projects.isPrivate, false),
        currentUserId > 0 ? eq(projects.authorId, currentUserId) : undefined
      ),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
    
    // Sort projects by monthly views and recency
    const sortedProjects = projectsResults.sort((a, b) => {
      const aMonthlyViews = projectMonthlyViews.get(a.id) || 0;
      const bMonthlyViews = projectMonthlyViews.get(b.id) || 0;
      
      // Calculate trending score: 70% monthly views + 30% recency
      const aScore = aMonthlyViews * 0.7 + 
        ((a.createdAt.getTime() - now.getTime() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000) * 3);
      const bScore = bMonthlyViews * 0.7 + 
        ((b.createdAt.getTime() - now.getTime() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000) * 3);
      
      return bScore - aScore; // Descending order
    });
    
    // Limit the number of results
    const limitedProjects = sortedProjects.slice(0, limit);
    
    // Convert to client-side Project type with all needed fields
    const projectsWithDetails = await Promise.all(
      limitedProjects.map(async (project) => {
        // Get tags for this project
        const projectTagsResult = await db.query.projectTags.findMany({
          where: eq(projectTags.projectId, project.id),
          with: {
            tag: true
          }
        });
        const tagNames = projectTagsResult.map(pt => pt.tag.name);
        
        // Get likes count
        const likesResult = await db.select({ count: count() })
          .from(likes)
          .where(and(
            eq(likes.projectId, project.id),
            isNull(likes.commentId),
            isNull(likes.replyId)
          ));
        const likesCount = Number(likesResult[0]?.count || 0);
        
        // Check if current user has liked this project
        const userLike = await db.query.likes.findFirst({
          where: and(
            eq(likes.projectId, project.id),
            eq(likes.userId, currentUserId),
            isNull(likes.commentId),
            isNull(likes.replyId)
          )
        });
        
        // Get comments count
        const commentsResult = await db.select({ count: count() })
          .from(comments)
          .where(eq(comments.projectId, project.id));
        const commentsCount = Number(commentsResult[0]?.count || 0);
        
        // Check if current user has bookmarked this project
        const userBookmark = await db.query.bookmarks.findFirst({
          where: and(
            eq(bookmarks.projectId, project.id),
            eq(bookmarks.userId, currentUserId)
          )
        });
        
        // Transform Date objects to strings for the frontend
        return {
          ...project,
          tags: tagNames,
          likesCount,
          commentsCount,
          isLiked: !!userLike,
          isBookmarked: !!userBookmark,
          // Handle the date format conversion
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString()
        } as Project;
      })
    );
    
    return projectsWithDetails;
  },
  
  async getProjectById(id: number, currentUserId: number = 0): Promise<Project | null> {
    // Get project by ID but respect privacy settings
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id)
        // Note: We don't filter by privacy here because we want to return the project
        // even if it's private, and let the caller decide whether to show it or not
        // based on ownership check in the route handler
      ),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
    
    if (!project) return null;
    
    // Get tags for this project
    const projectTagsResult = await db.query.projectTags.findMany({
      where: eq(projectTags.projectId, project.id),
      with: {
        tag: true
      }
    });
    
    // Map database tags to their properly cased versions
    const tagNames = projectTagsResult.map(pt => getProperCasedTag(pt.tag.name));
    
    // Get likes count
    const likesResult = await db.select({ count: count() })
      .from(likes)
      .where(and(
        eq(likes.projectId, project.id),
        isNull(likes.commentId),
        isNull(likes.replyId)
      ));
    const likesCount = Number(likesResult[0]?.count || 0);
    
    // Check if current user has liked this project
    const userLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.projectId, project.id),
        eq(likes.userId, currentUserId),
        isNull(likes.commentId),
        isNull(likes.replyId)
      )
    });
    
    // Get comments count
    const commentsResult = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.projectId, project.id));
    const commentsCount = Number(commentsResult[0]?.count || 0);
    
    // Check if current user has bookmarked this project
    const userBookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.projectId, project.id),
        eq(bookmarks.userId, currentUserId)
      )
    });
    
    // Get gallery images for this project
    const galleryImages = await db.query.projectGallery.findMany({
      where: eq(projectGallery.projectId, project.id),
      orderBy: asc(projectGallery.displayOrder)
    });
    
    return {
      ...project,
      tags: tagNames,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      likesCount,
      commentsCount,
      isLiked: !!userLike,
      isBookmarked: !!userBookmark,
      // Convert Date to string
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    } as Project;
  },
  
  async createProject(projectData: InsertProject, tagNames: string[], galleryImages: InsertProjectGallery[] = []): Promise<Project> {
    // Start a transaction to ensure everything is saved consistently
    return await db.transaction(async (tx) => {
      // Insert the project
      const [newProject] = await tx.insert(projects).values(projectData).returning();
      
      // Process tags
      // Remove duplicates & trim whitespace
      const trimmedTags = tagNames.map(tag => tag.trim());
      const uniqueTags = trimmedTags.filter((tag, index) => trimmedTags.indexOf(tag) === index);
      
      for (const tagName of uniqueTags) {
        if (!tagName) continue; // Skip empty tags
        
        // Check if tag exists (case-insensitive) or create it
        const properCasedTag = getProperCasedTag(tagName);
        let tagRecord = await tx.query.tags.findFirst({
          where: sql`LOWER(${tags.name}) = LOWER(${properCasedTag})`
        });
        
        if (!tagRecord) {
          // Store tag with proper casing but search case-insensitively
          [tagRecord] = await tx.insert(tags).values({ name: properCasedTag }).returning();
        }
        
        // Create project-tag relationship
        await tx.insert(projectTags).values({
          projectId: newProject.id,
          tagId: tagRecord.id
        });
      }
      
      // Process gallery images if any
      const savedGalleryImages: ProjectGalleryImage[] = [];
      if (galleryImages.length > 0) {
        for (const image of galleryImages) {
          // Set the projectId to the newly created project
          const [savedImage] = await tx.insert(projectGallery).values({
            ...image,
            projectId: newProject.id
          }).returning();
          savedGalleryImages.push(savedImage);
        }
      }
      
      // Get the author details
      const author = await tx.query.users.findFirst({
        where: eq(users.id, projectData.authorId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true
        }
      });

      // Return the project with additional client-side fields
      return {
        ...newProject,
        author: author || {
          id: projectData.authorId,
          username: 'Anonymous',
          avatarUrl: null
        },
        tags: uniqueTags.map(tag => getProperCasedTag(tag)),
        galleryImages: savedGalleryImages.length > 0 ? savedGalleryImages : undefined,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        isLiked: false,
        isBookmarked: false,
        // Convert Date to string
        createdAt: newProject.createdAt.toISOString(),
        updatedAt: newProject.updatedAt.toISOString()
      } as Project;
    });
  },
  
  async likeProject(projectId: number, userId: number): Promise<void> {
    // Check if like already exists
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.projectId, projectId),
        eq(likes.userId, userId),
        isNull(likes.commentId),
        isNull(likes.replyId)
      )
    });
    
    if (!existingLike) {
      await db.insert(likes).values({
        projectId,
        userId,
        commentId: null,
        replyId: null
      });
    }
  },
  
  async unlikeProject(projectId: number, userId: number): Promise<void> {
    await db.delete(likes).where(
      and(
        eq(likes.projectId, projectId),
        eq(likes.userId, userId),
        isNull(likes.commentId),
        isNull(likes.replyId)
      )
    );
  },
  
  async bookmarkProject(projectId: number, userId: number): Promise<void> {
    // Check if bookmark already exists
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.projectId, projectId),
        eq(bookmarks.userId, userId)
      )
    });
    
    if (!existingBookmark) {
      await db.insert(bookmarks).values({
        projectId,
        userId
      });
    }
  },
  
  async unbookmarkProject(projectId: number, userId: number): Promise<void> {
    await db.delete(bookmarks).where(
      and(
        eq(bookmarks.projectId, projectId),
        eq(bookmarks.userId, userId)
      )
    );
  },
  
  async incrementProjectViews(projectId: number): Promise<void> {
    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();
    
    // Start a transaction so both updates are atomic
    await db.transaction(async (tx) => {
      // Increment total project views
      await tx.update(projects)
        .set({ viewsCount: sql`${projects.viewsCount} + 1` })
        .where(eq(projects.id, projectId));
      
      // Find or create a record for the current month
      const existingRecord = await tx.query.projectViews.findFirst({
        where: and(
          eq(projectViews.projectId, projectId),
          eq(projectViews.month, currentMonth),
          eq(projectViews.year, currentYear)
        )
      });
      
      if (existingRecord) {
        // Update existing month record
        await tx.update(projectViews)
          .set({ viewsCount: sql`${projectViews.viewsCount} + 1` })
          .where(and(
            eq(projectViews.projectId, projectId),
            eq(projectViews.month, currentMonth),
            eq(projectViews.year, currentYear)
          ));
      } else {
        // Create new month record
        await tx.insert(projectViews).values({
          projectId,
          month: currentMonth,
          year: currentYear,
          viewsCount: 1
        });
      }
    });
  },

  // Project sharing
  async shareProject(projectId: number, platform: string, userId?: number): Promise<void> {
    // First create a share record
    await db.insert(shares).values({
      projectId,
      userId: userId || null,
      platform
    });

    // Then increment the share count on the project
    await db.update(projects)
      .set({ sharesCount: sql`${projects.sharesCount} + 1` })
      .where(eq(projects.id, projectId));
  },

  async getProjectShares(projectId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(shares)
      .where(eq(shares.projectId, projectId));
    return Number(result[0]?.count || 0);
  },
  
  // Comments
  
  async getProjectComments(
    projectId: number, 
    page: number = 1, 
    limit: number = 10, 
    sortBy: string = 'newest',
    currentUserId: number
  ): Promise<{ comments: Comment[]; hasMore: boolean; totalComments: number }> {
    const offset = (page - 1) * limit;
    
    // Count total comments
    const totalResult = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.projectId, projectId));
    const totalComments = Number(totalResult[0]?.count || 0);
    
    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { orderBy: [asc(comments.createdAt)] };
        break;
      case 'mostLiked':
        // This would ideally be implemented with a subquery or join,
        // but for simplicity, we'll handle it in JavaScript
        sortOptions = { orderBy: [desc(comments.createdAt)] };
        break;
      default: // newest
        sortOptions = { orderBy: [desc(comments.createdAt)] };
    }
    
    // Get comments
    let commentsResult = await db.query.comments.findMany({
      where: eq(comments.projectId, projectId),
      limit,
      offset,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      ...sortOptions
    });
    
    // Enrich comments with additional data
    const enrichedComments = await Promise.all(
      commentsResult.map(async (comment) => {
        // Get likes count
        const likesResult = await db.select({ count: count() })
          .from(likes)
          .where(and(
            eq(likes.commentId, comment.id),
            isNull(likes.projectId),
            isNull(likes.replyId)
          ));
        const likesCount = Number(likesResult[0]?.count || 0);
        
        // Check if current user has liked this comment
        const userLike = await db.query.likes.findFirst({
          where: and(
            eq(likes.commentId, comment.id),
            eq(likes.userId, currentUserId),
            isNull(likes.projectId),
            isNull(likes.replyId)
          )
        });
        
        // Get replies
        const repliesResult = await db.query.commentReplies.findMany({
          where: eq(commentReplies.commentId, comment.id),
          with: {
            author: {
              columns: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          },
          orderBy: [asc(commentReplies.createdAt)]
        });
        
        // Enrich replies with likes data
        const enrichedReplies = await Promise.all(
          repliesResult.map(async (reply) => {
            // Get likes count for reply
            const replyLikesResult = await db.select({ count: count() })
              .from(likes)
              .where(and(
                eq(likes.replyId, reply.id),
                isNull(likes.projectId),
                isNull(likes.commentId)
              ));
            const replyLikesCount = Number(replyLikesResult[0]?.count || 0);
            
            // Check if current user has liked this reply
            const userReplyLike = await db.query.likes.findFirst({
              where: and(
                eq(likes.replyId, reply.id),
                eq(likes.userId, currentUserId),
                isNull(likes.projectId),
                isNull(likes.commentId)
              )
            });
            
            // Get the author of the project to check if reply author is the project creator
            const project = await db.query.projects.findFirst({
              where: eq(projects.id, projectId),
              columns: {
                authorId: true
              }
            });
            
            return {
              ...reply,
              likesCount: replyLikesCount,
              isLiked: !!userReplyLike,
              isAuthor: project?.authorId === reply.author.id,
              // Convert Date to string
              createdAt: reply.createdAt.toISOString(),
              updatedAt: reply.updatedAt.toISOString()
            } as CommentReply;
          })
        );
        
        // Get the author of the project to check if comment author is the project creator
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, projectId),
          columns: {
            authorId: true
          }
        });
        
        return {
          ...comment,
          likesCount,
          isLiked: !!userLike,
          isAuthor: project?.authorId === comment.author.id,
          replies: enrichedReplies,
          // Convert Date to string
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString()
        } as Comment;
      })
    );
    
    // If sorting by most liked, do it here
    if (sortBy === 'mostLiked') {
      enrichedComments.sort((a, b) => b.likesCount - a.likesCount);
    }
    
    return {
      comments: enrichedComments,
      hasMore: offset + enrichedComments.length < totalComments,
      totalComments
    };
  },
  
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(commentData).returning();
    
    // Get author details
    const author = await db.query.users.findFirst({
      where: eq(users.id, commentData.authorId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true
      }
    });
    
    return {
      ...newComment,
      author: author || { id: commentData.authorId, username: 'unknown', avatarUrl: '' },
      likesCount: 0,
      isLiked: false,
      isAuthor: false,
      replies: [],
      // Convert Date to string
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString()
    } as Comment;
  },
  
  async createCommentReply(replyData: InsertReply): Promise<CommentReply> {
    const [newReply] = await db.insert(commentReplies).values(replyData).returning();
    
    // Get author details
    const author = await db.query.users.findFirst({
      where: eq(users.id, replyData.authorId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true
      }
    });
    
    return {
      ...newReply,
      author: author || { id: replyData.authorId, username: 'unknown', avatarUrl: '' },
      likesCount: 0,
      isLiked: false,
      isAuthor: false,
      // Convert Date to string
      createdAt: newReply.createdAt.toISOString(),
      updatedAt: newReply.updatedAt.toISOString()
    } as CommentReply;
  },
  
  async likeComment(commentId: number, userId: number): Promise<void> {
    // Check if like already exists
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.commentId, commentId),
        eq(likes.userId, userId),
        isNull(likes.projectId),
        isNull(likes.replyId)
      )
    });
    
    if (!existingLike) {
      await db.insert(likes).values({
        commentId,
        userId,
        projectId: null,
        replyId: null
      });
    }
  },
  
  async unlikeComment(commentId: number, userId: number): Promise<void> {
    await db.delete(likes).where(
      and(
        eq(likes.commentId, commentId),
        eq(likes.userId, userId),
        isNull(likes.projectId),
        isNull(likes.replyId)
      )
    );
  },
  
  async likeReply(replyId: number, userId: number): Promise<void> {
    // Check if like already exists
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.replyId, replyId),
        eq(likes.userId, userId),
        isNull(likes.projectId),
        isNull(likes.commentId)
      )
    });
    
    if (!existingLike) {
      await db.insert(likes).values({
        replyId,
        userId,
        projectId: null,
        commentId: null
      });
    }
  },
  
  async unlikeReply(replyId: number, userId: number): Promise<void> {
    await db.delete(likes).where(
      and(
        eq(likes.replyId, replyId),
        eq(likes.userId, userId),
        isNull(likes.projectId),
        isNull(likes.commentId)
      )
    );
  },
  
  // Tags
  
  async getPopularTags(limit: number = 5): Promise<string[]> {
    // Get tag IDs with project counts
    const tagCounts = await db.select({
      tagId: projectTags.tagId,
      count: count()
    })
    .from(projectTags)
    .groupBy(projectTags.tagId)
    .orderBy(desc(sql`count`))
    .limit(limit);
    
    // Get tag names with proper casing
    const tagDetails = await Promise.all(
      tagCounts.map(async (tc) => {
        const tagRecord = await db.query.tags.findFirst({
          where: eq(tags.id, tc.tagId)
        });
        return tagRecord ? getProperCasedTag(tagRecord.name) : '';
      })
    );
    
    return tagDetails.filter(name => name !== '');
  },
  
  async getAllTags(): Promise<string[]> {
    // Get all tags ordered alphabetically
    const allTags = await db.query.tags.findMany({
      orderBy: asc(tags.name)
    });
    
    // Map database tags to their properly cased versions
    return allTags.map(tag => getProperCasedTag(tag.name));
  },
  
  async getAllCodingTools(): Promise<CodingTool[]> {
    // Get all coding tools ordered alphabetically
    const tools = await db.query.codingTools.findMany({
      orderBy: asc(codingTools.name)
    });
    
    // Convert dates to strings for client
    return tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      category: tool.category || undefined,
      isPopular: Boolean(tool.isPopular),
      createdAt: tool.createdAt.toISOString()
    }));
  },
  
  async getPopularCodingTools(limit: number = 10): Promise<CodingTool[]> {
    // Get popular coding tools
    const tools = await db.query.codingTools.findMany({
      where: eq(codingTools.isPopular, true),
      orderBy: asc(codingTools.name),
      limit
    });
    
    // Convert dates to strings for client
    return tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      category: tool.category || undefined,
      isPopular: Boolean(tool.isPopular),
      createdAt: tool.createdAt.toISOString()
    }));
  },
  
  async createCodingTool(toolData: InsertCodingTool): Promise<CodingTool> {
    // Insert the coding tool
    const [newTool] = await db.insert(codingTools).values(toolData).returning();
    
    return {
      id: newTool.id,
      name: newTool.name,
      category: newTool.category || undefined,
      isPopular: Boolean(newTool.isPopular),
      createdAt: newTool.createdAt.toISOString()
    };
  },
  
  async updateProject(projectId: number, projectData: Partial<InsertProject>, tagNames: string[], galleryImages?: InsertProjectGallery[]): Promise<Project | null> {
    // Start a transaction to ensure everything is updated consistently
    return await db.transaction(async (tx) => {
      // Check if project exists and belongs to the authenticated user
      const existingProject = await tx.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
      
      if (!existingProject) {
        return null;
      }
      
      // Update the project
      await tx.update(projects)
        .set(projectData)
        .where(eq(projects.id, projectId));
      
      // Fetch the updated project
      const [updatedProject] = await tx.select()
        .from(projects)
        .where(eq(projects.id, projectId));
      
      if (!updatedProject) {
        return null;
      }
      
      // Delete existing project tags
      await tx.delete(projectTags)
        .where(eq(projectTags.projectId, projectId));
      
      // Process new tags
      // Remove duplicates & trim whitespace
      const trimmedTags = tagNames.map(tag => tag.trim());
      const uniqueTags = trimmedTags.filter((tag, index) => trimmedTags.indexOf(tag) === index);
      
      for (const tagName of uniqueTags) {
        if (!tagName) continue; // Skip empty tags
        
        // Check if tag exists (case-insensitive) or create it
        const properCasedTag = getProperCasedTag(tagName);
        let tagRecord = await tx.query.tags.findFirst({
          where: sql`LOWER(${tags.name}) = LOWER(${properCasedTag})`
        });
        
        if (!tagRecord) {
          // Store tag with proper casing but search case-insensitively
          [tagRecord] = await tx.insert(tags).values({ name: properCasedTag }).returning();
        }
        
        // Create project-tag relationship
        await tx.insert(projectTags).values({
          projectId: projectId,
          tagId: tagRecord.id
        });
      }
      
      // Process gallery images if provided
      let savedGalleryImages: ProjectGalleryImage[] = [];
      if (galleryImages && galleryImages.length > 0) {
        // Get existing gallery images
        await tx.delete(projectGallery)
          .where(eq(projectGallery.projectId, projectId));
          
        // Add new gallery images
        for (const image of galleryImages) {
          const [savedImage] = await tx.insert(projectGallery).values({
            ...image,
            projectId: projectId
          }).returning();
          savedGalleryImages.push(savedImage);
        }
      } else {
        // If no new gallery images provided, get existing ones
        savedGalleryImages = await tx.query.projectGallery.findMany({
          where: eq(projectGallery.projectId, projectId),
          orderBy: asc(projectGallery.displayOrder)
        });
      }
      
      // Get the author details
      const author = await tx.query.users.findFirst({
        where: eq(users.id, updatedProject.authorId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true
        }
      });

      // Return the project with additional client-side fields
      return {
        ...updatedProject,
        author: author || {
          id: updatedProject.authorId,
          username: 'Anonymous',
          avatarUrl: null
        },
        tags: uniqueTags.map(tag => getProperCasedTag(tag)),
        galleryImages: savedGalleryImages.length > 0 ? savedGalleryImages : undefined,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: updatedProject.viewsCount,
        isLiked: false,
        isBookmarked: false,
        // Convert Date to string
        createdAt: updatedProject.createdAt.toISOString(),
        updatedAt: updatedProject.updatedAt.toISOString()
      } as Project;
    });
  },
  
  async deleteProject(projectId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      try {
        // Delete related data first
        // Delete project views related to the project
        await tx.delete(projectViews)
          .where(eq(projectViews.projectId, projectId));
        
        // Delete shares related to the project
        await tx.delete(shares)
          .where(eq(shares.projectId, projectId));
        
        // Delete likes related to the project
        await tx.delete(likes)
          .where(eq(likes.projectId, projectId));
          
        // Delete bookmarks related to the project
        await tx.delete(bookmarks)
          .where(eq(bookmarks.projectId, projectId));
          
        // Delete gallery images related to the project
        await tx.delete(projectGallery)
          .where(eq(projectGallery.projectId, projectId));
        
        // Delete comment replies related to comments on the project
        await tx.delete(commentReplies)
          .where(inArray(commentReplies.commentId, 
            tx.select({ id: comments.id })
              .from(comments)
              .where(eq(comments.projectId, projectId))
          ));
        
        // Delete comments on the project
        await tx.delete(comments)
          .where(eq(comments.projectId, projectId));
        
        // Delete project tags
        await tx.delete(projectTags)
          .where(eq(projectTags.projectId, projectId));
        
        // Finally, delete the project
        await tx.delete(projects)
          .where(eq(projects.id, projectId));
        
        return true;
      } catch (error) {
        console.error('Error deleting project:', error);
        return false;
      }
    });
  },

  // User Methods
  async getUserByUsername(username: string): Promise<any | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return user || null;
  },

  async getUserById(id: number): Promise<any | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return user || null;
  },

  async updateUser(userId: number, userData: any): Promise<any | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // User Skills Methods
  async getUserSkills(userId: number): Promise<UserSkill[]> {
    return await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
      orderBy: [asc(userSkills.category), asc(userSkills.skill)]
    });
  },

  async addUserSkill(userId: number, category: string, skill: string): Promise<UserSkill> {
    // Check if skill already exists for this user and category
    const existingSkill = await db.query.userSkills.findFirst({
      where: and(
        eq(userSkills.userId, userId),
        eq(userSkills.category, category),
        eq(userSkills.skill, skill)
      )
    });

    if (existingSkill) {
      return existingSkill;
    }

    // Add new skill
    const [newSkill] = await db.insert(userSkills).values({
      userId,
      category,
      skill,
      createdAt: new Date()
    }).returning();

    return newSkill;
  },

  async removeUserSkill(skillId: number, userId: number): Promise<boolean> {
    try {
      // Make sure the skill belongs to the user
      const skill = await db.query.userSkills.findFirst({
        where: and(
          eq(userSkills.id, skillId),
          eq(userSkills.userId, userId)
        )
      });

      if (!skill) {
        return false;
      }

      await db.delete(userSkills).where(eq(userSkills.id, skillId));
      return true;
    } catch (error) {
      console.error('Error removing user skill:', error);
      return false;
    }
  },

  async getUserSkillCategories(userId: number): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: userSkills.category })
      .from(userSkills)
      .where(eq(userSkills.userId, userId))
      .orderBy(asc(userSkills.category));
    
    return result.map(r => r.category);
  },

  // User Activity Methods
  async getUserActivities(userId: number, limit: number = 10): Promise<any[]> {
    const activities = await db.query.userActivity.findMany({
      where: eq(userActivity.userId, userId),
      orderBy: [desc(userActivity.createdAt)],
      limit
    });

    return await Promise.all(activities.map(async (activity) => {
      let targetData = null;

      // Fetch related data based on activity type
      if (activity.type === activityTypes.PROJECT_CREATED || 
          activity.type === activityTypes.PROJECT_LIKED) {
        targetData = await db.query.projects.findFirst({
          where: eq(projects.id, activity.targetId),
          columns: {
            id: true,
            title: true,
            imageUrl: true
          }
        });
      } else if (activity.type === activityTypes.COMMENT_ADDED) {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, activity.targetId),
          columns: {
            id: true,
            content: true,
            projectId: true
          }
        });

        if (comment) {
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, comment.projectId),
            columns: {
              id: true,
              title: true
            }
          });
          
          targetData = {
            ...comment,
            project: project || { id: 0, title: 'Unknown Project' }
          };
        }
      } else if (activity.type === activityTypes.REPLY_ADDED) {
        const reply = await db.query.commentReplies.findFirst({
          where: eq(commentReplies.id, activity.targetId),
          columns: {
            id: true,
            content: true,
            commentId: true
          }
        });

        if (reply) {
          const comment = await db.query.comments.findFirst({
            where: eq(comments.id, reply.commentId),
            columns: {
              id: true,
              projectId: true
            }
          });
          
          if (comment) {
            const project = await db.query.projects.findFirst({
              where: eq(projects.id, comment.projectId),
              columns: {
                id: true,
                title: true
              }
            });
            
            targetData = {
              ...reply,
              comment: { id: comment.id },
              project: project || { id: 0, title: 'Unknown Project' }
            };
          }
        }
      }

      return {
        id: activity.id,
        type: activity.type,
        createdAt: activity.createdAt,
        targetData
      };
    }));
  },

  async recordUserActivity(userId: number, type: string, targetId: number): Promise<void> {
    await db.insert(userActivity).values({
      userId,
      type,
      targetId,
      createdAt: new Date()
    });
  },

  // Get user's liked projects
  async getUserLikedProjects(userId: number, currentUserId: number = 0): Promise<Project[]> {
    // Get all project IDs liked by the user
    const likedProjectIds = await db.select({ projectId: likes.projectId })
      .from(likes)
      .where(and(
        eq(likes.userId, userId),
        isNull(likes.commentId),
        isNull(likes.replyId)
      ));

    if (likedProjectIds.length === 0) {
      return [];
    }

    // Get the full projects with all details
    const likedProjects = await Promise.all(
      likedProjectIds.map(async ({ projectId }) => {
        if (projectId === null) return null;
        return await this.getProjectById(projectId, currentUserId);
      })
    );

    // Filter out any null projects (might have been deleted)
    return likedProjects.filter(project => project !== null) as Project[];
  },

  // Notification Methods
  async createNotification(data: {
    userId: number;
    type: string;
    actorId?: number;
    projectId?: number;
    commentId?: number;
    replyId?: number;
  }): Promise<Notification> {
    const [notification] = await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      actorId: data.actorId,
      projectId: data.projectId,
      commentId: data.commentId,
      replyId: data.replyId,
      read: false,
      createdAt: new Date()
    }).returning();
    
    return notification;
  },

  async getUserNotifications(userId: number, options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    
    // Build query conditions using correct column name format (snake_case in DB)
    const conditions = [eq(notifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }
    
    // Get total count for pagination
    const countResult = await db.select({ count: count() })
      .from(notifications)
      .where(and(...conditions));
    
    const total = Number(countResult[0]?.count || 0);
    
    // Get notifications with relations
    const notificationResults = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
      with: {
        actor: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        project: {
          columns: {
            id: true,
            title: true
          }
        },
        comment: {
          columns: {
            id: true,
            content: true
          }
        },
        reply: {
          columns: {
            id: true,
            content: true
          }
        }
      }
    });
    
    // Convert the results to the expected Notification type
    const formattedNotifications = notificationResults.map(notification => {
      return {
        ...notification,
        actor: notification.actor ? {
          id: notification.actor.id,
          username: notification.actor.username,
          avatarUrl: notification.actor.avatarUrl || undefined
        } : undefined,
        project: notification.project ? {
          id: notification.project.id,
          title: notification.project.title
        } : undefined,
        comment: notification.comment ? {
          id: notification.comment.id,
          content: notification.comment.content
        } : undefined,
        reply: notification.reply ? {
          id: notification.reply.id,
          content: notification.reply.content
        } : undefined
      };
    });
    
    return {
      notifications: formattedNotifications,
      total
    };
  },

  async markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    return Number(result[0]?.count || 0);
  },

  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      await db.delete(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },

  // Project Gallery Methods
  async addProjectGalleryImage(galleryData: InsertProjectGallery): Promise<ProjectGalleryImage> {
    const [newImage] = await db.insert(projectGallery).values(galleryData).returning();
    return newImage;
  },

  async updateProjectGalleryImage(imageId: number, data: Partial<Omit<InsertProjectGallery, 'id' | 'projectId' | 'createdAt'>>): Promise<ProjectGalleryImage | null> {
    const [updatedImage] = await db.update(projectGallery)
      .set(data)
      .where(eq(projectGallery.id, imageId))
      .returning();
    return updatedImage || null;
  },

  async deleteProjectGalleryImage(imageId: number): Promise<boolean> {
    try {
      await db.delete(projectGallery).where(eq(projectGallery.id, imageId));
      return true;
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      return false;
    }
  },

  async getProjectGalleryImages(projectId: number): Promise<ProjectGalleryImage[]> {
    return await db.query.projectGallery.findMany({
      where: eq(projectGallery.projectId, projectId),
      orderBy: asc(projectGallery.displayOrder)
    });
  },

  /**
   * Get project evaluation by project ID
   * @param projectId Project ID
   * @returns Project evaluation data or null if not found
   */
  async getProjectEvaluation(projectId: number): Promise<ProjectEvaluation | null> {
    const evaluation = await db.query.projectEvaluations.findFirst({
      where: eq(projectEvaluations.projectId, projectId)
    });
    
    if (!evaluation) return null;
    
    // Cast evaluation to correct type for TypeScript
    return evaluation as unknown as ProjectEvaluation;
  },

  /**
   * Create or update project evaluation
   * @param projectId Project ID
   * @param evaluation Evaluation data
   * @param fitScore Score from 0-100
   * @returns Created/updated evaluation
   */
  async saveProjectEvaluation(
    projectId: number, 
    evaluationData: any, 
    fitScore: number
  ): Promise<ProjectEvaluation> {
    // Check if evaluation already exists
    const existingEval = await db.query.projectEvaluations.findFirst({
      where: eq(projectEvaluations.projectId, projectId)
    });

    if (existingEval) {
      // Update existing evaluation
      const [updated] = await db.update(projectEvaluations)
        .set({
          evaluation: evaluationData,
          fitScore,
          updatedAt: new Date()
        })
        .where(eq(projectEvaluations.id, existingEval.id))
        .returning();
      
      // Cast to correct type for TypeScript
      return updated as unknown as ProjectEvaluation;
    } else {
      // Create new evaluation
      const [created] = await db.insert(projectEvaluations)
        .values({
          projectId,
          evaluation: evaluationData,
          fitScore,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Cast to correct type for TypeScript
      return created as unknown as ProjectEvaluation;
    }
  },

  /**
   * Delete project evaluation
   * @param projectId Project ID
   * @returns Success status
   */
  async deleteProjectEvaluation(projectId: number): Promise<boolean> {
    try {
      await db.delete(projectEvaluations)
        .where(eq(projectEvaluations.projectId, projectId));
      return true;
    } catch (error) {
      console.error('Error deleting project evaluation:', error);
      return false;
    }
  }
};
