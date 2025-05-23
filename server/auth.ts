import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users, projects, likes, comments, bookmarks, projectTags, Project } from "@shared/schema";
import { eq, sql, desc, asc, and, isNull, count } from "drizzle-orm";
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
      twitterUrl?: string | null;
      githubUrl?: string | null;
      linkedinUrl?: string | null;
      websiteUrl?: string | null;
      role: string;
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

async function getUserByIdentifier(identifier: string) {
  // First try to find by username (case insensitive)
  const userByUsername = await db.query.users.findFirst({
    where: sql`LOWER(${users.username}) = LOWER(${identifier})`
  });
  
  if (userByUsername) {
    return userByUsername;
  }
  
  // If not found by username, try by email
  return await db.query.users.findFirst({
    where: sql`LOWER(${users.email}) = LOWER(${identifier})`
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

async function updateUser(userId: number, userData: Partial<Omit<Express.User, 'id'>>) {
  // Extract fields that are valid for the users table
  const validFields: any = {
    ...(userData.username !== undefined && { username: userData.username }),
    ...(userData.email !== undefined && { email: userData.email }),
    ...(userData.bio !== undefined && { bio: userData.bio }),
    ...(userData.avatarUrl !== undefined && { avatarUrl: userData.avatarUrl }),
    ...(userData.twitterUrl !== undefined && { twitterUrl: userData.twitterUrl }),
    ...(userData.githubUrl !== undefined && { githubUrl: userData.githubUrl }),
    ...(userData.linkedinUrl !== undefined && { linkedinUrl: userData.linkedinUrl }),
    ...(userData.websiteUrl !== undefined && { websiteUrl: userData.websiteUrl }),
    ...(userData.password !== undefined && { password: userData.password }),
    updatedAt: new Date()
  };

  const [user] = await db.update(users)
    .set(validFields)
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
        // Find user by either username (case-insensitive) or email
        const user = await getUserByIdentifier(username);
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
      // Check if username already exists (case-insensitive)
      const existingUserByUsername = await db.query.users.findFirst({
        where: sql`LOWER(${users.username}) = LOWER(${req.body.username})`
      });
      
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists (case-insensitive)
      const existingUserByEmail = await db.query.users.findFirst({
        where: sql`LOWER(${users.email}) = LOWER(${req.body.email})`
      });
      
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
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

  // Google authentication endpoint with token verification
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, name, picture, token } = req.body;
      
      if (!googleId || !email || !token) {
        return res.status(400).json({ message: "Missing required Google authentication data" });
      }
      
      console.log("Google OAuth Authentication request received for:", email);
      
      // Verify token with Google
      try {
        // Verify the token with Google's OAuth API
        const verifyTokenUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
        const verifyResponse = await fetch(`${verifyTokenUrl}?access_token=${token}`);
        
        if (!verifyResponse.ok) {
          console.error('Token verification failed:', await verifyResponse.text());
          return res.status(401).json({ message: "Invalid Google token" });
        }
        
        const tokenInfo = await verifyResponse.json();
        
        // Check that the token is for our application
        const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
        if (tokenInfo.aud !== clientId) {
          console.error('Token was not issued for this application');
          return res.status(401).json({ message: "Invalid token audience" });
        }
        
        console.log("Google token verified successfully");
      } catch (verifyError) {
        console.error("Error verifying Google token:", verifyError);
        return res.status(401).json({ message: "Failed to verify Google authentication" });
      }
      
      // Check if user already exists with this email
      let user = await db.query.users.findFirst({
        where: sql`LOWER(${users.email}) = LOWER(${email})`
      });
      
      if (user) {
        // User exists, log them in
        console.log("Existing user found with email:", email);
        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          return res.status(200).json(user);
        });
      } else {
        // Create a new user with Google data
        console.log("Creating new user for Google account:", email);
        
        // Generate a username from the name or email
        const baseUsername = name ? 
          name.toLowerCase().replace(/\s+/g, "_") : 
          email.split("@")[0];
        
        // Check if username already exists and make it unique if needed
        let username = baseUsername;
        let counter = 1;
        let usernameExists = true;
        
        while (usernameExists) {
          const existingUser = await db.query.users.findFirst({
            where: sql`LOWER(${users.username}) = LOWER(${username})`
          });
          
          if (!existingUser) {
            usernameExists = false;
          } else {
            username = `${baseUsername}_${counter}`;
            counter++;
          }
        }
        
        // Create random password for the account (won't be used since login is via Google)
        const randomPassword = randomBytes(16).toString("hex");
        
        // Create the user
        const newUser = {
          username,
          email,
          password: randomPassword,
          avatarUrl: picture || null,
          bio: "",
          role: "user"
        };
        
        console.log("Creating new user with data:", { username, email });
        user = await createUser(newUser);
        
        req.login(user, (err) => {
          if (err) {
            console.error("Registration error:", err);
            return res.status(500).json({ message: "Registration failed" });
          }
          return res.status(201).json(user);
        });
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

    // Google OAuth callback endpoint - exchanges auth code for tokens
  app.post("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, redirect_uri } = req.body;
      
      if (!code || !redirect_uri) {
        return res.status(400).json({ message: "Missing required callback parameters" });
      }
      
      console.log("Processing Google OAuth callback with code");
      
      // Exchange the authorization code for tokens
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const tokenRequestBody = {
        code,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code'
      };
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenRequestBody)
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        return res.status(401).json({ message: "Failed to exchange authorization code for tokens" });
      }
      
      const tokenData = await tokenResponse.json();
      const { access_token, id_token } = tokenData;
      
      if (!access_token) {
        return res.status(401).json({ message: "No access token received from Google" });
      }
      
      // Get user profile with the access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      if (!userInfoResponse.ok) {
        return res.status(401).json({ message: "Failed to get user info from Google" });
      }
      
      const userInfo = await userInfoResponse.json();
      const { sub: googleId, email, name, picture } = userInfo;
      
      if (!googleId || !email) {
        return res.status(400).json({ message: "Incomplete user information from Google" });
      }
      
      console.log("Google user info retrieved:", { googleId, email, name });
      
      // Check if user already exists with this email
      let user = await db.query.users.findFirst({
        where: sql`LOWER(${users.email}) = LOWER(${email})`
      });
      
      if (user) {
        // User exists, log them in
        console.log("Existing user found with email:", email);
        // Use a promise to handle the async login
        const loginPromise = new Promise<void>((resolve, reject) => {
          req.login(user, (err) => {
            if (err) {
              console.error("Login error:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        try {
          await loginPromise;
          // Successfully logged in
          return res.status(200).json({ user, accessToken: access_token });
        } catch (err) {
          return res.status(500).json({ message: "Login failed" });
        }
      } else {
        // Create a new user with Google data
        console.log("Creating new user for Google account:", email);
        
        // Generate a username from the name or email
        const baseUsername = name ? 
          name.toLowerCase().replace(/\s+/g, "_") : 
          email.split("@")[0];
        
        // Check if username already exists and make it unique if needed
        let username = baseUsername;
        let counter = 1;
        let usernameExists = true;
        
        while (usernameExists) {
          const existingUser = await db.query.users.findFirst({
            where: sql`LOWER(${users.username}) = LOWER(${username})`
          });
          
          if (!existingUser) {
            usernameExists = false;
          } else {
            username = `${baseUsername}_${counter}`;
            counter++;
          }
        }
        
        // Create random password for the account (won't be used since login is via Google)
        const randomPassword = randomBytes(16).toString("hex");
        
        // Create the user
        const newUser = {
          username,
          email,
          password: randomPassword,
          avatarUrl: picture || null,
          bio: "",
          role: "user"
        };
        
        console.log("Creating new user with data:", { username, email });
        user = await createUser(newUser);
        
        // Use a promise to handle the async login
        const loginPromise = new Promise<void>((resolve, reject) => {
          req.login(user, (err) => {
            if (err) {
              console.error("Registration error:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        try {
          await loginPromise;
          // Successfully logged in
          return res.status(201).json({ user, accessToken: access_token });
        } catch (err) {
          return res.status(500).json({ message: "Registration failed" });
        }
      }
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.json(null);
    res.json(req.user);
  });

  // Get current user profile with their projects
  app.get("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // Return empty data for unauthenticated users
        return res.json({ user: null, projects: [] });
      }
      
      const userId = req.user!.id;
      
      // Get user's projects with relationship data
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.authorId, userId),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
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
      
      // Enhance projects with counts and tags
      const projectsWithDetails = await Promise.all(
        userProjects.map(async (project) => {
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
              eq(likes.userId, userId),
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
              eq(bookmarks.userId, userId)
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
      
      res.json({ user: req.user, projects: projectsWithDetails });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get user roles/roles for filtering profiles
  app.get("/api/user-roles", async (req, res) => {
    try {
      // Get distinct roles from submitted projects
      const result = await db.select({ role: sql<string>`DISTINCT(${projects.vibeCodingTool})` })
        .from(projects)
        .where(sql`${projects.vibeCodingTool} IS NOT NULL AND ${projects.vibeCodingTool} != ''`)
        .execute();
          
      // Extract roles from result
      const roles = result.map(item => item.role).filter(Boolean);
          
      res.json({ roles });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ message: 'Failed to fetch user roles' });
    }
  });

  // Get list of all users/profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string || "";
      const roleFilter = req.query.role as string || "";
      const tagFilter = req.query.tag as string || "";
      const sort = req.query.sort as string || "newest";
      
      // Calculate offset
      const offset = (page - 1) * limit;

      // Create a reusable query configuration
      const queryConfig = {
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          createdAt: true
        },
        limit,
        offset
      };

      // Build the where condition based on filters
      let whereCondition: any = undefined;

      if (search) {
        whereCondition = sql`${users.username} LIKE ${`%${search}%`}`;
      }
      
      // Count query with the same where condition
      let countQuery;
      if (whereCondition) {
        countQuery = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereCondition)
          .execute();
      } else {
        countQuery = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .execute();
      }
      
      // Determine sort order
      let usersQuery;
      
      // Prepare the query based on sort option
      if (sort === "activity") {
        // For activity, sort by users with most projects
        // We need to use a more complex query with raw SQL
        const activityQuery = await db
          .select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            createdAt: users.createdAt,
            projectCount: sql<number>`(SELECT COUNT(*) FROM ${projects} WHERE ${projects.authorId} = ${users.id})`
          })
          .from(users)
          .where(whereCondition || sql`1=1`)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(sql<number>`(SELECT COUNT(*) FROM ${projects} WHERE "author_id" = ${users.id})`))
          .execute();
          
        usersQuery = activityQuery;
      } else {
        // For other sort options, use a simpler approach
        const query = await db.query.users.findMany({
          ...queryConfig,
          where: whereCondition,
          orderBy: sort === "oldest" 
            ? [asc(users.createdAt)]
            : [desc(users.createdAt)]
        });
        
        usersQuery = query;
      }

      // Apply filters for role and tag
      let filteredUsers = usersQuery;
      let filteredUserIds = new Set<number>();
      let shouldFilter = false;
      
      // Get users who used the specific AI tool in their projects
      if (roleFilter) {
        shouldFilter = true;
        const usersWithRole = await db.select({ authorId: projects.authorId })
          .from(projects)
          .where(sql`${projects.vibeCodingTool} = ${roleFilter}`)
          .groupBy(projects.authorId)
          .execute();

        const userIds = new Set(usersWithRole.map((user: { authorId: number }) => user.authorId));
        // If this is the first filter, set filteredUserIds, otherwise intersect with existing
        filteredUserIds = userIds;
      }
      
      // Get users who have projects with the specified tag
      if (tagFilter) {
        shouldFilter = true;
        const usersWithTag = await db.execute(sql`
          SELECT DISTINCT p."author_id" as "authorId"
          FROM ${projects} p
          JOIN project_tags pt ON p.id = pt."project_id"
          JOIN tags t ON pt."tag_id" = t.id
          WHERE LOWER(t.name) = LOWER(${tagFilter})
        `);
        
        // Handle the result as an array of objects with appropriate type safety
        const tagUserIds = new Set<number>();
        const rows = usersWithTag as unknown as Array<Record<string, any>>;
        for (const row of rows) {
          if (row && typeof row === 'object' && 'authorId' in row && typeof row.authorId === 'number') {
            tagUserIds.add(row.authorId);
          }
        }
        
        // If roleFilter was also set, we need to find the intersection of both filters
        if (filteredUserIds.size > 0) {
          // Keep only IDs that exist in both sets
          const intersection = new Set<number>();
          // Convert Set to Array for iteration to avoid TS issues
          Array.from(filteredUserIds).forEach(id => {
            if (tagUserIds.has(id)) {
              intersection.add(id);
            }
          });
          filteredUserIds = intersection;
        } else {
          // This is the first/only filter
          filteredUserIds = tagUserIds;
        }
      }
      
      // Apply filters if needed
      if (shouldFilter) {
        // Handle both types of user query results (with and without projectCount)
        if (sort === "activity") {
          // If we're using the activity sort, we have the projectCount field
          const typedUsers = usersQuery as Array<{ 
            id: number; 
            username: string; 
            avatarUrl: string | null; 
            bio: string | null; 
            createdAt: Date; 
            projectCount: number 
          }>;
          filteredUsers = typedUsers.filter(user => filteredUserIds.has(user.id));
        } else {
          // For other sorts, we're using the standard user fields
          filteredUsers = usersQuery.filter((user: any) => filteredUserIds.has(user.id));
        }

        // Recalculate total count
        let totalFilteredUsers;
        if (roleFilter && tagFilter) {
          // For combined role and tag filter, count is just the size of the intersection
          totalFilteredUsers = [{ count: filteredUserIds.size }];
        } else if (roleFilter) {
          totalFilteredUsers = await db.select({ count: sql<number>`count(DISTINCT ${projects.authorId})` })
            .from(projects)
            .where(sql`${projects.vibeCodingTool} = ${roleFilter}`)
            .execute();
        } else if (tagFilter) {
          totalFilteredUsers = await db.execute(sql`
            SELECT COUNT(DISTINCT p."author_id") as count
            FROM ${projects} p
            JOIN project_tags pt ON p.id = pt."project_id"
            JOIN tags t ON pt."tag_id" = t.id
            WHERE LOWER(t.name) = LOWER(${tagFilter})
          `);
        }
        
        countQuery = totalFilteredUsers || [{ count: 0 }];
      }

      // Handle the count safely
      let totalCount = 0;
      if (Array.isArray(countQuery) && countQuery.length > 0 && 'count' in countQuery[0]) {
        totalCount = countQuery[0].count as number;
      }
      
      // Enhance user profiles with projects and likes counts
      const enhancedProfiles = await Promise.all(filteredUsers.map(async (user: any) => {
        // Count user's projects
        const projectsCount = sort === "activity" && 'projectCount' in user
          ? user.projectCount
          : await db.select({ count: count() })
              .from(projects)
              .where(eq(projects.authorId, user.id))
              .then(res => Number(res[0]?.count || 0));
        
        // Count total likes on user's projects
        const likesResult = await db.execute(sql`
          SELECT COUNT(*) AS count
          FROM ${likes} l
          JOIN ${projects} p ON l."project_id" = p.id
          WHERE p."author_id" = ${user.id}
          AND l."comment_id" IS NULL
          AND l."reply_id" IS NULL
        `);
        
        let likesCount = 0;
        if (Array.isArray(likesResult) && likesResult.length > 0) {
          const row = likesResult[0] as Record<string, any>;
          likesCount = Number(row.count || 0);
        }
        
        return {
          ...user,
          // Format the date
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
          projectsCount,
          likesCount
        };
      }));
      
      // Return with pagination info
      res.json({
        profiles: enhancedProfiles,
        pagination: {
          page,
          limit,
          totalProfiles: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page < Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ message: 'Failed to fetch profiles' });
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
      
      // Current user ID for like/bookmark status
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Get user's projects with relationship data
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.authorId, user.id),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
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
      
      // Enhance projects with counts and tags
      const projectsWithDetails = await Promise.all(
        userProjects.map(async (project) => {
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
          const userLike = currentUserId ? await db.query.likes.findFirst({
            where: and(
              eq(likes.projectId, project.id),
              eq(likes.userId, currentUserId),
              isNull(likes.commentId),
              isNull(likes.replyId)
            )
          }) : null;
          
          // Get comments count
          const commentsResult = await db.select({ count: count() })
            .from(comments)
            .where(eq(comments.projectId, project.id));
          const commentsCount = Number(commentsResult[0]?.count || 0);
          
          // Check if current user has bookmarked this project
          const userBookmark = currentUserId ? await db.query.bookmarks.findFirst({
            where: and(
              eq(bookmarks.projectId, project.id),
              eq(bookmarks.userId, currentUserId)
            )
          }) : null;
          
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
      
      // Remove sensitive information
      const { password, ...publicUserInfo } = user;
      
      res.json({ user: publicUserInfo, projects: projectsWithDetails });
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
      const { bio, email, username, twitterUrl, githubUrl, linkedinUrl, websiteUrl } = req.body;

      // Check if username already exists (if updating username)
      if (username && username !== req.user!.username) {
        const existingUser = await db.query.users.findFirst({
          where: sql`LOWER(${users.username}) = LOWER(${username}) AND ${users.id} != ${userId}`
        });
        
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      // Validate social URLs if provided
      if (twitterUrl && !twitterUrl.startsWith('https://twitter.com/')) {
        return res.status(400).json({ message: "Twitter URL must start with https://twitter.com/" });
      }
      
      if (githubUrl && !githubUrl.startsWith('https://github.com/')) {
        return res.status(400).json({ message: "GitHub URL must start with https://github.com/" });
      }
      
      if (linkedinUrl && !linkedinUrl.startsWith('https://linkedin.com/')) {
        return res.status(400).json({ message: "LinkedIn URL must start with https://linkedin.com/" });
      }

      // Only allow updating certain fields
      const updateData: Partial<Express.User> = {};
      if (bio !== undefined) updateData.bio = bio;
      if (email !== undefined) updateData.email = email;
      if (username !== undefined) updateData.username = username;
      if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
      if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
      if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
      if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;

      const updatedUser = await updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the session with the latest user data
      // Use promise-based approach for async login
      const loginPromise = new Promise<void>((resolve, reject) => {
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session update error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      try {
        await loginPromise;
        res.status(200).json(updatedUser);
      } catch (err) {
        throw err;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Reset password
  app.post("/api/profile/reset-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      // Get current user with password
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if this is a Google auth user
      if (user.password && user.password.length > 30) {
        return res.status(400).json({ 
          message: "Password reset is not available for accounts linked to Google login" 
        });
      }
      
      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update password" });
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
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
      // Use promise-based approach for async login
      const loginPromise = new Promise<void>((resolve, reject) => {
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session update error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      try {
        await loginPromise;
        res.status(200).json(updatedUser);
      } catch (err) {
        throw err;
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
}
