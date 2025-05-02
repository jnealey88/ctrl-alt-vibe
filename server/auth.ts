import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users, projects } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "../db";
import multer from "multer";
import path from "path";
import fs from "fs";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      bio?: string | null;
      avatarUrl?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Set up storage for uploaded files
const uploadDir = path.join(process.cwd(), "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to only allow certain image types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Initialize multer with our configuration
const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function getUserByUsername(username: string) {
  return await db.query.users.findFirst({
    where: eq(users.username, username)
  });
}

async function getUser(id: number) {
  return await db.query.users.findFirst({
    where: eq(users.id, id)
  });
}

async function createUser(userData: any) {
  const [user] = await db.insert(users)
    .values({
      ...userData,
      password: await hashPassword(userData.password)
    })
    .returning();
  
  return user;
}

async function updateUser(userId: number, userData: Partial<Omit<Express.User, 'id' | 'password'>>) {
  const [user] = await db.update(users)
    .set({
      ...userData,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();
  
  return user;
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true 
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ctrl-alt-vibe-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await createUser(req.body);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Get current user profile with their projects
  app.get("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const userId = req.user!.id;
      
      // Get user's projects
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.authorId, userId),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)]
      });
      
      res.json({ user: req.user, projects: userProjects });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get user profile by username with their projects
  app.get("/api/profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // Find the user by username
      const user = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's projects
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.authorId, user.id),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)]
      });
      
      // Remove sensitive information
      const { password, ...publicUserInfo } = user;
      
      res.json({ user: publicUserInfo, projects: userProjects });
    } catch (error) {
      console.error("Error fetching profile by username:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.patch("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user!.id;
      const { bio, email } = req.body;

      // Only allow updating certain fields
      const updateData: Partial<Express.User> = {};
      if (bio !== undefined) updateData.bio = bio;
      if (email !== undefined) updateData.email = email;

      const updatedUser = await updateUser(userId, updateData);

      // Update the session with the latest user data
      req.login(updatedUser, (err) => {
        if (err) throw err;
        res.status(200).json(updatedUser);
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile photo
  app.post("/api/profile/avatar", upload.single('avatar'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;
      const avatarUrl = `/uploads/${req.file.filename}`;

      const updatedUser = await updateUser(userId, { avatarUrl });

      // Update the session with the latest user data
      req.login(updatedUser, (err) => {
        if (err) throw err;
        res.status(200).json(updatedUser);
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
}
