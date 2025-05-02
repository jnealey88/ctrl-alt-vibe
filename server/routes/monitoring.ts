/**
 * Monitoring routes for system health and performance metrics
 */

import { Router } from 'express';
import performance from '../utils/performance';
import logger from '../utils/logger';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Basic health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'development',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus
    });
  } catch (error: any) {
    logger.error(`Health check failed: ${error.message}`, 'monitoring');
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics endpoint (protected)
router.get('/metrics', async (req, res) => {
  try {
    // Simple API key check - in production would use proper auth
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.MONITORING_API_KEY) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    
    // Get performance metrics
    const metrics = {
      recent: performance.getRecentMetrics(20),
      slow: performance.getFilteredMetrics({ minDuration: 500 }), // Operations taking > 500ms
      summary: performance.getSummary(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error: any) {
    logger.error(`Metrics retrieval failed: ${error.message}`, 'monitoring');
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve metrics'
    });
  }
});

/**
 * Checks database health by running a simple query
 */
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    // Run a simple query to check if the database is responsive
    const result = await db.execute(sql`SELECT 1 as health_check`);
    const duration = Date.now() - startTime;
    
    return {
      status: 'connected',
      responseTime: duration
    };
  } catch (error: any) {
    logger.error(`Database health check failed: ${error.message}`, 'monitoring');
    return {
      status: 'error',
      message: error.message
    };
  }
}

export default router;
