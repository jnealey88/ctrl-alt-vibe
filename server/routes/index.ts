import { Express } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { writeSitemap, generateSitemap } from '../utils/sitemap-generator';
import { registerAdminRoutes } from './admin';
import { registerBlogRoutes } from './blog';
import { registerCommentRoutes } from './comments';
import { registerNotificationRoutes } from './notifications';
import { registerProjectRoutes } from './projects';
import { registerTagRoutes } from './tags';
import { registerUserRoutes } from './users';
import { registerUploadRoutes } from './uploads';
import monitoringRoutes from './monitoring';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server once for the entire application
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Register all route modules
  app.use(monitoringRoutes);
  registerAdminRoutes(app);
  registerBlogRoutes(app);
  registerCommentRoutes(app);
  registerNotificationRoutes(app);
  registerProjectRoutes(app);
  registerTagRoutes(app);
  registerUserRoutes(app);
  registerUploadRoutes(app);
  
  // Generate sitemap.xml initially
  try {
    console.log('Generating initial sitemap.xml...');
    await writeSitemap();
    console.log('Initial sitemap.xml generated successfully');
  } catch (error) {
    console.error('Error generating initial sitemap.xml:', error);
  }
  
  // Set up a timer to regenerate the sitemap periodically (once a day)
  setInterval(async () => {
    try {
      console.log('Regenerating sitemap.xml...');
      await writeSitemap();
      console.log('Sitemap.xml regenerated successfully');
    } catch (error) {
      console.error('Error regenerating sitemap.xml:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Route to dynamically serve the sitemap
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Generate a fresh sitemap
      const xml = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error serving dynamic sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
  
  // Route to serve robots.txt
  app.get('/robots.txt', (req, res) => {
    try {
      const robotsTxtPath = path.join(process.cwd(), 'public', 'robots.txt');
      if (fs.existsSync(robotsTxtPath)) {
        const content = fs.readFileSync(robotsTxtPath, 'utf8');
        res.header('Content-Type', 'text/plain');
        res.send(content);
      } else {
        // If file doesn't exist, generate a default one
        const content = 'User-agent: *\nAllow: /\n\n# Sitemap\nSitemap: https://ctrlaltvibe.com/sitemap.xml\n';
        res.header('Content-Type', 'text/plain');
        res.send(content);
      }
    } catch (error) {
      console.error('Error serving robots.txt:', error);
      res.status(500).send('Error serving robots.txt');
    }
  });
  
  // Store connected clients by userId for pushing notifications
  const clients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    // Handle messages from clients
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication to associate websocket with user
        if (data.type === 'auth') {
          const userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
            console.log(`WebSocket authenticated for user ${userId}`);
            
            // Send confirmation
            ws.send(JSON.stringify({ type: 'auth_success' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      // Remove client from the clients map
      clients.forEach((socket, userId) => {
        if (socket === ws) {
          clients.delete(userId);
          console.log(`Removed user ${userId} from WebSocket clients`);
        }
      });
    });
  });
  
  // Helper to send notification to a specific user
  // Use type assertion to avoid TypeScript errors
  (global as any).sendNotificationToUser = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      console.log(`Real-time notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} not connected via WebSocket or connection not ready`);
    }
  };
  
  return httpServer;
}
