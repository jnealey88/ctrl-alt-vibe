/**
 * Utility for tracking and logging performance metrics
 */

import logger from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  tags?: Record<string, string | number | boolean>;
  data?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private slowThreshold: number = 500; // milliseconds

  /**
   * Start tracking the execution time of a specific operation
   * @param name Name of the operation being tracked
   * @param tags Optional tags to categorize the operation
   * @returns Function to call when the operation is complete
   */
  track(name: string, tags?: Record<string, string | number | boolean>) {
    const startTime = process.hrtime();
    
    return (additionalData?: Record<string, any>) => {
      const hrtime = process.hrtime(startTime);
      const duration = hrtime[0] * 1000 + hrtime[1] / 1000000; // Convert to milliseconds
      
      const metric: PerformanceMetric = {
        name,
        duration, 
        timestamp: new Date(),
        tags,
        data: additionalData
      };
      
      this.recordMetric(metric);
      return duration;
    };
  }
  
  /**
   * Track database query performance
   * @param queryName Name of the query
   * @param tags Additional metadata about the query
   * @returns Function to call when the query is complete
   */
  trackQuery(queryName: string, tags?: Record<string, string | number | boolean>) {
    return this.track(`db:${queryName}`, { type: 'database', ...tags });
  }
  
  /**
   * Track API endpoint performance
   * @param endpoint API endpoint path
   * @param method HTTP method
   * @returns Function to call when the request is complete
   */
  trackEndpoint(endpoint: string, method: string) {
    return this.track(`api:${method}:${endpoint}`, { type: 'api', method, endpoint });
  }
  
  /**
   * Records a performance metric
   * @param metric The performance metric to record
   */
  private recordMetric(metric: PerformanceMetric) {
    // Store the metric
    this.metrics.push(metric);
    
    // Keep only the last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
    
    // Log slow operations
    if (metric.duration > this.slowThreshold) {
      const tagsStr = metric.tags ? ` [${Object.entries(metric.tags).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
      logger.warn(`Slow operation detected: ${metric.name}${tagsStr} took ${metric.duration.toFixed(2)}ms`, 'performance');
    }
  }
  
  /**
   * Get recent metrics
   * @param limit Maximum number of metrics to return
   * @returns Array of recent performance metrics
   */
  getRecentMetrics(limit: number = 100) {
    return this.metrics.slice(-limit);
  }
  
  /**
   * Get metrics filtered by name or tags
   * @param options Filter options
   * @returns Filtered metrics
   */
  getFilteredMetrics(options: { name?: string; tags?: Record<string, any>; minDuration?: number }) {
    return this.metrics.filter(metric => {
      if (options.name && !metric.name.includes(options.name)) {
        return false;
      }
      
      if (options.minDuration && metric.duration < options.minDuration) {
        return false;
      }
      
      if (options.tags) {
        for (const [key, value] of Object.entries(options.tags)) {
          if (!metric.tags || metric.tags[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Set the threshold for what is considered a "slow" operation
   * @param threshold Threshold in milliseconds
   */
  setSlowThreshold(threshold: number) {
    this.slowThreshold = threshold;
  }
  
  /**
   * Get performance summary statistics
   * @returns Summary statistics for all tracked operations
   */
  getSummary() {
    const operationStats: Record<string, { count: number; totalTime: number; avgTime: number; maxTime: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!operationStats[metric.name]) {
        operationStats[metric.name] = { count: 0, totalTime: 0, avgTime: 0, maxTime: 0 };
      }
      
      const stats = operationStats[metric.name];
      stats.count++;
      stats.totalTime += metric.duration;
      stats.avgTime = stats.totalTime / stats.count;
      stats.maxTime = Math.max(stats.maxTime, metric.duration);
    });
    
    return operationStats;
  }
}

export const performance = new PerformanceMonitor();
export default performance;
