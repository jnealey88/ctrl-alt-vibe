import { db } from '@db';
import { 
  projects, 
  projectTags, 
  tags, 
  likes, 
  bookmarks, 
  shares, 
  projectViews,
  projectInsertSchema,
  type Project,
  type InsertProject
} from '@shared/schema';
import { eq, and, desc, sql, asc, count, inArray, not, isNull, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class ProjectService {
  // Helper to get proper cased tag for display
  private getProperCasedTag(tagName: string): string {
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
  }

  async getProjects({ 
    page = 1, 
    limit = 6, 
    tag = null, 
    search = null, 
    sort = 'default', 
    user = null,
    currentUserId = 0
  }: { 
    page?: number; 
    limit?: number; 
    tag?: string | null; 
    search?: string | null; 
    sort?: string | null; 
    user?: string | null;
    currentUserId?: number;
  }): Promise<{ projects: Project[]; total: number }> {
    // Ensure valid page and limit
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const offset = (page - 1) * limit;
    
    // Start building the query
    let query = db.select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      imageUrl: projects.imageUrl,
      projectUrl: projects.projectUrl,
      vibeCodingTool: projects.vibeCodingTool,
      authorId: projects.authorId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      featured: projects.featured,
      isPrivate: projects.isPrivate,
      // Count related entities
      likesCount: sql<number>`cast(count(distinct ${likes.id}) as int)`,
      bookmarksCount: sql<number>`cast(count(distinct ${bookmarks.id}) as int)`,
      viewsCount: sql<number>`cast(count(distinct ${projectViews.id}) as int)`,
      sharesCount: sql<number>`cast(count(distinct ${shares.id}) as int)`,
      // Check if current user has liked/bookmarked
      isLiked: sql<boolean>`case when count(case when ${likes.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
      isBookmarked: sql<boolean>`case when count(case when ${bookmarks.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
    })
    .from(projects)
    // Join users for author info
    .innerJoin('users', eq(projects.authorId, sql<number>`users.id`))
    // Left joins for counts and checks
    .leftJoin(likes, eq(projects.id, likes.projectId))
    .leftJoin(bookmarks, eq(projects.id, bookmarks.projectId))
    .leftJoin(projectViews, eq(projects.id, projectViews.projectId))
    .leftJoin(shares, eq(projects.id, shares.projectId))
    // Only public projects unless the user is the author
    .where(user ? eq(projects.authorId, Number(user)) : and(
      or(eq(projects.isPrivate, false), currentUserId > 0 ? eq(projects.authorId, currentUserId) : sql`false`)
    ))
    .groupBy(projects.id, sql`users.id`, sql`users.username`, sql`users.avatar_url`);
    
    // Add tag filter if provided
    if (tag) {
      // Join through projectTags and filter by tag name
      query = query
        .innerJoin(projectTags, eq(projects.id, projectTags.projectId))
        .innerJoin(tags, eq(projectTags.tagId, tags.id))
        .where(eq(tags.name, tag));
    }
    
    // Add search filter if provided
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = query.where(
        or(
          like(sql`lower(${projects.title})`, searchLower),
          like(sql`lower(${projects.description})`, searchLower),
          like(sql`lower(users.username)`, searchLower)
        )
      );
    }
    
    // Create a query to count total matching projects
    const countQuery = db.select({ count: sql<number>`count(distinct ${projects.id})` })
      .from(projects)
      .where(query._entities[0].value);
    
    // Apply ordering based on sort parameter
    switch(sort) {
      case 'trending':
        // Trending is based on recent activity (views, likes, comments)
        query = query.orderBy(desc(sql`(count(${likes.id}) * 3 + count(${projectViews.id}) * 2 + count(${shares.id}) * 5)`));
        break;
      case 'newest':
        query = query.orderBy(desc(projects.createdAt));
        break;
      case 'oldest':
        query = query.orderBy(asc(projects.createdAt));
        break;
      case 'mostLiked':
        query = query.orderBy(desc(sql`count(${likes.id})`));
        break;
      case 'mostViewed':
        query = query.orderBy(desc(sql`count(${projectViews.id})`));
        break;
      default:
        // Default sort is most recent + featured first
        query = query.orderBy(desc(projects.featured), desc(projects.createdAt));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the queries
    const [projectResults, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    // Fetch all tags for these projects
    const projectIds = projectResults.map(p => p.id);
    const projectTagResults = projectIds.length > 0 
      ? await db.select({
          projectId: projectTags.projectId,
          tag: tags.name
        })
        .from(projectTags)
        .innerJoin(tags, eq(projectTags.tagId, tags.id))
        .where(inArray(projectTags.projectId, projectIds))
      : [];
    
    // Group tags by project
    const tagsByProject = projectTagResults.reduce((acc, { projectId, tag }) => {
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(this.getProperCasedTag(tag));
      return acc;
    }, {} as Record<number, string[]>);
    
    // Format the projects with complete info
    const projects = projectResults.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      projectUrl: p.projectUrl,
      vibeCodingTool: p.vibeCodingTool,
      author: {
        id: p.authorId,
        username: userRow.username, // from join
        avatarUrl: userRow.avatar_url // from join
      },
      tags: tagsByProject[p.id] || [],
      likesCount: p.likesCount,
      viewsCount: p.viewsCount,
      sharesCount: p.sharesCount,
      commentsCount: 0, // Not included in this query for performance
      isLiked: p.isLiked,
      isBookmarked: p.isBookmarked,
      featured: p.featured,
      isPrivate: p.isPrivate,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }));
    
    return {
      projects,
      total: countResult[0].count
    };
  }

  async getFeaturedProject(currentUserId: number = 0): Promise<Project | null> {
    // Find a featured project
    const query = db.select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      longDescription: projects.longDescription,
      projectUrl: projects.projectUrl,
      imageUrl: projects.imageUrl,
      vibeCodingTool: projects.vibeCodingTool,
      authorId: projects.authorId,
      featured: projects.featured,
      isPrivate: projects.isPrivate,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      // Count related entities
      likesCount: sql<number>`cast(count(distinct ${likes.id}) as int)`,
      bookmarksCount: sql<number>`cast(count(distinct ${bookmarks.id}) as int)`,
      viewsCount: sql<number>`cast(count(distinct ${projectViews.id}) as int)`,
      sharesCount: sql<number>`cast(count(distinct ${shares.id}) as int)`,
      // Check if current user has liked/bookmarked
      isLiked: sql<boolean>`case when count(case when ${likes.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
      isBookmarked: sql<boolean>`case when count(case when ${bookmarks.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
    })
    .from(projects)
    // Join users for author info
    .innerJoin('users', eq(projects.authorId, sql<number>`users.id`))
    // Left joins for counts and checks
    .leftJoin(likes, eq(projects.id, likes.projectId))
    .leftJoin(bookmarks, eq(projects.id, bookmarks.projectId))
    .leftJoin(projectViews, eq(projects.id, projectViews.projectId))
    .leftJoin(shares, eq(projects.id, shares.projectId))
    // Only featured and public projects
    .where(and(eq(projects.featured, true), eq(projects.isPrivate, false)))
    .groupBy(projects.id, sql`users.id`, sql`users.username`, sql`users.avatar_url`)
    // Order randomly to get different featured projects on refresh
    .orderBy(sql`random()`)
    .limit(1);
    
    const result = await query;
    if (result.length === 0) return null;
    
    const project = result[0];
    
    // Fetch tags for this project
    const projectTagResults = await db.select({
      tag: tags.name
    })
    .from(projectTags)
    .innerJoin(tags, eq(projectTags.tagId, tags.id))
    .where(eq(projectTags.projectId, project.id));
    
    const formattedTags = projectTagResults.map(t => this.getProperCasedTag(t.tag));
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      longDescription: project.longDescription,
      imageUrl: project.imageUrl,
      projectUrl: project.projectUrl,
      vibeCodingTool: project.vibeCodingTool,
      author: {
        id: project.authorId,
        username: userRow.username, // from join
        avatarUrl: userRow.avatar_url // from join 
      },
      tags: formattedTags,
      likesCount: project.likesCount,
      viewsCount: project.viewsCount,
      sharesCount: project.sharesCount,
      commentsCount: 0, // Not included in this query for performance
      isLiked: project.isLiked,
      isBookmarked: project.isBookmarked,
      featured: project.featured,
      isPrivate: project.isPrivate,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async getTrendingProjects(limit: number = 4, currentUserId: number = 0): Promise<Project[]> {
    // Slightly simplified for the prototype, but follows the same pattern as getProjects
    // In a full implementation, we would use a more sophisticated trending algorithm
    // This could consider recency, likes, comments, shares, etc. with proper weighting

    const query = db.select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      imageUrl: projects.imageUrl,
      projectUrl: projects.projectUrl,
      vibeCodingTool: projects.vibeCodingTool,
      authorId: projects.authorId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      featured: projects.featured,
      isPrivate: projects.isPrivate,
      // Count related entities
      likesCount: sql<number>`cast(count(distinct ${likes.id}) as int)`,
      viewsCount: sql<number>`cast(count(distinct ${projectViews.id}) as int)`,
      sharesCount: sql<number>`cast(count(distinct ${shares.id}) as int)`,
      // Check if current user has liked/bookmarked
      isLiked: sql<boolean>`case when count(case when ${likes.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
      isBookmarked: sql<boolean>`case when count(case when ${bookmarks.userId} = ${currentUserId} and ${currentUserId} > 0 then 1 end) > 0 then true else false end`,
    })
    .from(projects)
    // Join users for author info
    .innerJoin('users', eq(projects.authorId, sql<number>`users.id`))
    // Left joins for counts and checks
    .leftJoin(likes, eq(projects.id, likes.projectId))
    .leftJoin(bookmarks, eq(projects.id, bookmarks.projectId))
    .leftJoin(projectViews, eq(projects.id, projectViews.projectId))
    .leftJoin(shares, eq(projects.id, shares.projectId))
    // Only public projects
    .where(eq(projects.isPrivate, false))
    .groupBy(projects.id, sql`users.id`, sql`users.username`, sql`users.avatar_url`)
    // Trending is based on recent activity (views, likes, comments)
    .orderBy(desc(sql`(count(${likes.id}) * 3 + count(${projectViews.id}) * 2 + count(${shares.id}) * 5)`), desc(projects.createdAt))
    .limit(limit);
    
    const result = await query;
    
    // Fetch all tags for these projects
    const projectIds = result.map(p => p.id);
    const projectTagResults = projectIds.length > 0 
      ? await db.select({
          projectId: projectTags.projectId,
          tag: tags.name
        })
        .from(projectTags)
        .innerJoin(tags, eq(projectTags.tagId, tags.id))
        .where(inArray(projectTags.projectId, projectIds))
      : [];
    
    // Group tags by project
    const tagsByProject = projectTagResults.reduce((acc, { projectId, tag }) => {
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(this.getProperCasedTag(tag));
      return acc;
    }, {} as Record<number, string[]>);
    
    // Format the projects with complete info
    return result.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      projectUrl: p.projectUrl,
      vibeCodingTool: p.vibeCodingTool,
      author: {
        id: p.authorId,
        username: userRow.username, // from join
        avatarUrl: userRow.avatar_url // from join
      },
      tags: tagsByProject[p.id] || [],
      likesCount: p.likesCount,
      viewsCount: p.viewsCount,
      sharesCount: p.sharesCount,
      commentsCount: 0, // Not included in this query for performance
      isLiked: p.isLiked,
      isBookmarked: p.isBookmarked,
      featured: p.featured,
      isPrivate: p.isPrivate,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }));
  }

  // Note: Other ProjectService methods would be included here
  // This is just a sample of the key methods for demonstration purposes
}
