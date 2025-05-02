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
} from "@shared/schema";
import type { 
  Project, 
  Comment, 
  CommentReply, 
  InsertProject, 
  InsertComment, 
  InsertReply
} from "@shared/schema";

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
      for (const tagName of tagNames) {
        // Check if tag exists or create it
        let tagRecord = await tx.query.tags.findFirst({
          where: eq(tags.name, tagName.toLowerCase())
        });
        
        if (!tagRecord) {
          [tagRecord] = await tx.insert(tags).values({ name: tagName.toLowerCase() }).returning();
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
        tags: tagNames,
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
    
    // Get tag names
    const tagDetails = await Promise.all(
      tagCounts.map(async (tc) => {
        const tagRecord = await db.query.tags.findFirst({
          where: eq(tags.id, tc.tagId)
        });
        return tagRecord?.name || '';
      })
    );
    
    return tagDetails.filter(name => name !== '');
  }
};
