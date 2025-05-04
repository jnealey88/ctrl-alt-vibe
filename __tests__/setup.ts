import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb';
process.env.SESSION_SECRET = 'test-secret';

// Mock console.error to avoid noisy test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning: ReactDOM.render')) return;
    if (args[0]?.includes?.('act(...) is not supported in production builds')) return;
    originalConsoleError(...args);
  };
  
  console.warn = (...args) => {
    if (args[0]?.includes?.('Deprecation warning')) return;
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
