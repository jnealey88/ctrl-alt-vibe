import { db } from "./index";
import * as schema from "../shared/schema";

async function updateSchema() {
  try {
    console.log('Updating database schema with indexes...');
    
    // Add indexes to projects table
    await db.execute(`CREATE INDEX IF NOT EXISTS title_idx ON projects (title);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS author_idx ON projects (author_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS featured_idx ON projects (featured);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS created_at_idx ON projects (created_at);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS views_count_idx ON projects (views_count);`);
    
    // Add indexes to projectTags table
    await db.execute(`CREATE INDEX IF NOT EXISTS project_id_idx ON project_tags (project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS tag_id_idx ON project_tags (tag_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS project_tag_idx ON project_tags (project_id, tag_id);`);
    
    // Add index to tags table
    await db.execute(`CREATE INDEX IF NOT EXISTS tags_name_idx ON tags (name);`);
    
    // Add indexes to comments table
    await db.execute(`CREATE INDEX IF NOT EXISTS comments_project_id_idx ON comments (project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments (author_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments (created_at);`);
    
    // Add indexes to comment_replies table
    await db.execute(`CREATE INDEX IF NOT EXISTS comment_replies_comment_id_idx ON comment_replies (comment_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS comment_replies_author_id_idx ON comment_replies (author_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS comment_replies_created_at_idx ON comment_replies (created_at);`);
    
    // Add indexes to likes table
    await db.execute(`CREATE INDEX IF NOT EXISTS likes_project_id_idx ON likes (project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS likes_comment_id_idx ON likes (comment_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS likes_reply_id_idx ON likes (reply_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes (user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS likes_user_project_idx ON likes (user_id, project_id);`);
    
    // Add indexes to bookmarks table
    await db.execute(`CREATE INDEX IF NOT EXISTS bookmarks_project_id_idx ON bookmarks (project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks (user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS bookmarks_user_project_idx ON bookmarks (user_id, project_id);`);
    
    // Add indexes to shares table
    await db.execute(`CREATE INDEX IF NOT EXISTS shares_project_id_idx ON shares (project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS shares_user_id_idx ON shares (user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS shares_platform_idx ON shares (platform);`);

    console.log('Database schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

updateSchema();
