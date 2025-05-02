import { db } from "@db";
import { eq, and, desc, sql, asc, count, isNull, like, inArray } from "drizzle-orm";
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
} from "@shared/schema";
import type { 
  Project, 
  Comment, 
  CommentReply, 
  InsertProject, 
  InsertComment, 
  InsertReply,
  CodingTool,
  InsertCodingTool
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

export const storage = {
  // Projects

  async getProjects({ 
    page = 1, 
    limit = 6, 
    tag = "", 
    search = "", 
    sort = "trending", 
    user = "" 
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
        // Simple trending algorithm - focusing just on views and recency
        sortOptions = { 
          orderBy: [
            desc(sql`(${projects.viewsCount} * 0.7 + EXTRACT(EPOCH FROM (${projects.createdAt} - NOW() + INTERVAL '30 days'))/86400 * 3)`)
          ] 
        };
    }
    
    // Current user ID (in a real app, this would come from auth)
    const currentUserId = 1;
    
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
    
    return {
      projects: projectsWithDetails,
      hasMore: offset + projectsWithDetails.length < total,
      total
    };
  },
  
  async getFeaturedProject(): Promise<Project | null> {
    const featuredProject = await db.query.projects.findFirst({
      where: eq(projects.featured, true),
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
    
    // Current user ID (in a real app, this would come from auth)
    const currentUserId = 1;
    
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
  
  async getTrendingProjects(limit: number = 4): Promise<Project[]> {
    // Current user ID (in a real app, this would come from auth)
    const currentUserId = 1;
    
    // Get projects using our trending algorithm
    const projectsResults = await db.query.projects.findMany({
      limit,
      orderBy: [
        desc(sql`(${projects.viewsCount} * 0.7 + EXTRACT(EPOCH FROM (${projects.createdAt} - NOW() + INTERVAL '30 days'))/86400 * 3)`)
      ],
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
    
    // Convert to client-side Project type with all needed fields
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
  
  async getProjectById(id: number): Promise<Project | null> {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
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
    
    // Current user ID (in a real app, this would come from auth)
    const currentUserId = 1;
    
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
    
    return {
      ...project,
      tags: tagNames,
      likesCount,
      commentsCount,
      isLiked: !!userLike,
      isBookmarked: !!userBookmark,
      // Convert Date to string
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    } as Project;
  },
  
  async createProject(projectData: InsertProject, tagNames: string[]): Promise<Project> {
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
    await db.update(projects)
      .set({ viewsCount: sql`${projects.viewsCount} + 1` })
      .where(eq(projects.id, projectId));
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
  
  async updateProject(projectId: number, projectData: Partial<InsertProject>, tagNames: string[]): Promise<Project | null> {
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
        // Delete likes related to the project
        await tx.delete(likes)
          .where(eq(likes.projectId, projectId));
          
        // Delete bookmarks related to the project
        await tx.delete(bookmarks)
          .where(eq(bookmarks.projectId, projectId));
        
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
  }
};
