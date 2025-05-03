import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

/**
 * Middleware to check if user is authenticated without blocking unauthenticated users
 */
export function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Always proceed, authentication state is checked inside route handlers
  next();
}

/**
 * Middleware to check if user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
}
