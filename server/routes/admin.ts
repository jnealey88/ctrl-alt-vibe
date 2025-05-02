import { Request, Response } from "express";
import { db } from "@db";
import { users, projects, comments } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { isAdmin } from "../middleware/auth";

export function registerAdminRoutes(app: any) {
  // Get all users - Admin only
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: desc(users.createdAt)
      });

      // Remove sensitive data like passwords
      const safeUsers = allUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      res.json({ users: safeUsers });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all projects - Admin only
  app.get("/api/admin/projects", isAdmin, async (req: Request, res: Response) => {
    try {
      const allProjects = await db.query.projects.findMany({
        orderBy: desc(projects.createdAt),
        with: {
          author: true
        }
      });

      // Format projects for frontend
      const formattedProjects = allProjects.map(project => {
        return {
          ...project,
          author: {
            id: project.author.id,
            username: project.author.username,
            avatarUrl: project.author.avatarUrl
          },
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString()
        };
      });

      res.json({ projects: formattedProjects });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get reported comments - Admin only
  app.get("/api/admin/reported-comments", isAdmin, async (req: Request, res: Response) => {
    try {
      // For now just return all comments until we implement reporting
      const reportedComments = await db.query.comments.findMany({
        orderBy: desc(comments.createdAt),
        limit: 20,
        with: {
          author: true,
          project: true
        }
      });

      // Format comments for frontend
      const formattedComments = reportedComments.map(comment => {
        return {
          ...comment,
          author: {
            id: comment.author.id,
            username: comment.author.username,
            avatarUrl: comment.author.avatarUrl
          },
          project: {
            id: comment.project.id,
            title: comment.project.title
          },
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString()
        };
      });

      res.json({ comments: formattedComments });
    } catch (error) {
      console.error("Error fetching reported comments:", error);
      res.status(500).json({ message: "Failed to fetch reported comments" });
    }
  });

  // Delete a user - Admin only
  app.delete("/api/admin/user/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deleting your own account
      if (req.user?.id === userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      // Delete the user
      await db.delete(users).where(eq(users.id, userId));
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Delete a project - Admin only
  app.delete("/api/admin/project/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);

      // Delete the project
      await db.delete(projects).where(eq(projects.id, projectId));
      
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Delete a comment - Admin only
  app.delete("/api/admin/comment/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);

      // Delete the comment
      await db.delete(comments).where(eq(comments.id, commentId));
      
      res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Feature a project - Admin only
  app.put("/api/admin/projects/:id/feature", isAdmin, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);

      // First, unfeature all currently featured projects
      await db
        .update(projects)
        .set({ featured: false })
        .where(eq(projects.featured, true));

      // Then, feature the selected project
      await db
        .update(projects)
        .set({ featured: true })
        .where(eq(projects.id, projectId));
      
      res.json({ success: true, message: "Project featured successfully" });
    } catch (error) {
      console.error("Error featuring project:", error);
      res.status(500).json({ message: "Failed to feature project" });
    }
  });

  // Update user role - Admin only
  app.put("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!role || (role !== "admin" && role !== "user")) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Update the user's role
      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId));
      
      res.json({ success: true, message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
}
