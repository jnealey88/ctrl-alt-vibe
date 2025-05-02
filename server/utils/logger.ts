/**
 * Enhanced logging utility with support for different log levels
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Format and log a message with appropriate styling based on log level
 * @param message The message to log
 * @param level The log level (info, warn, error, debug)
 * @param source The source of the log message
 */
export function logger(message: string, level: LogLevel = 'info', source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const prefix = `${formattedTime} [${source}]`;
  
  switch (level) {
    case 'error':
      console.error(`\x1b[31m${prefix} ERROR: ${message}\x1b[0m`);
      break;
    case 'warn':
      console.warn(`\x1b[33m${prefix} WARN: ${message}\x1b[0m`);
      break;
    case 'debug':
      // Only output debug logs in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`\x1b[36m${prefix} DEBUG: ${message}\x1b[0m`);
      }
      break;
    case 'info':
    default:
      console.log(`${prefix} ${message}`);
      break;
  }
}

export default {
  info: (message: string, source?: string) => logger(message, 'info', source),
  warn: (message: string, source?: string) => logger(message, 'warn', source),
  error: (message: string, source?: string) => logger(message, 'error', source),
  debug: (message: string, source?: string) => logger(message, 'debug', source),
};
