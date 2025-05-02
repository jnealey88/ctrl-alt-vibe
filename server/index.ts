import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import performance from './utils/performance';
import apiResponse from './utils/apiResponse';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' },
  // Whitelist paths that don't need rate limiting (like static assets)
  skip: (req) => !req.path.startsWith('/api/')
});

// Apply rate limiting to all requests
app.use(apiLimiter);

// More restrictive rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Limit each IP to 10 login/register attempts per hour
  message: { error: 'Too many login attempts, please try again later.' },
  // Only apply to authentication routes
  skip: (req) => !(req.path === '/api/login' || req.path === '/api/register')
});

// Apply stricter rate limiting to authentication endpoints
app.use(authLimiter);

// Performance monitoring middleware
app.use((req, res, next) => {
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
  // Skip non-API routes
  if (!path.startsWith('/api')) {
    return next();
  }
  
  // Start performance tracking
  const endTracking = performance.trackEndpoint(path, req.method);
  
  // Capture response for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  
  // Monitor response completion
  res.on("finish", () => {
    // Stop performance tracking and get duration
    const duration = endTracking({
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      contentLength: res.getHeader('content-length'),
      responseType: res.getHeader('content-type')
    });
    
    // Construct log line
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration.toFixed(2)}ms`;
    
    // Add response data when appropriate
    if (capturedJsonResponse) {
      // Log compact or full response based on size
      let responseStr = JSON.stringify(capturedJsonResponse);
      if (responseStr.length > 80) {
        responseStr = responseStr.slice(0, 79) + "…";
      }
      logLine += ` :: ${responseStr}`;
    }
    
    // Use our enhanced logger
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](logLine, 'api');
  });
  
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add 404 handler for API routes - this should come after Vite middleware
  app.use(notFoundHandler);
  
  // Add centralized error handling
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`serving on port ${port}`, 'server');
  });
})();
