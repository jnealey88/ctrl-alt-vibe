import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCodingTools, usePopularCodingTools } from '../../client/src/hooks/use-coding-tools';

// Mock the fetch function
global.fetch = jest.fn();

const mockCodingTools = [
  { id: 1, name: 'React', category: 'Frontend', isPopular: true, createdAt: '2023-01-01T00:00:00.000Z' },
  { id: 2, name: 'Node.js', category: 'Backend', isPopular: true, createdAt: '2023-01-02T00:00:00.000Z' },
  { id: 3, name: 'TypeScript', category: 'Language', isPopular: true, createdAt: '2023-01-03T00:00:00.000Z' }
];

const mockPopularTools = [
  { id: 1, name: 'React', category: 'Frontend', isPopular: true, createdAt: '2023-01-01T00:00:00.000Z' },
  { id: 2, name: 'Node.js', category: 'Backend', isPopular: true, createdAt: '2023-01-02T00:00:00.000Z' }
];

// Create a wrapper component with the QueryClientProvider
const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCodingTools Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return empty tools array while loading', () => {
    // Mock a pending fetch request
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCodingTools(), {
      wrapper: createQueryClientWrapper()
    });

    expect(result.current.tools).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should return tools when API call succeeds', async () => {
    // Mock a successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tools: mockCodingTools })
    });

    const { result } = renderHook(() => useCodingTools(), {
      wrapper: createQueryClientWrapper()
    });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.tools).toEqual([]);

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual(mockCodingTools);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle API error', async () => {
    // Mock a failed fetch response
    const error = new Error('API Error');
    (global.fetch as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useCodingTools(), {
      wrapper: createQueryClientWrapper()
    });

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it('should handle empty response data', async () => {
    // Mock a successful fetch with null data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null)
    });

    const { result } = renderHook(() => useCodingTools(), {
      wrapper: createQueryClientWrapper()
    });

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });
});

describe('usePopularCodingTools Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should use the provided limit parameter', async () => {
    // Mock a successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tools: mockPopularTools })
    });

    const { result } = renderHook(() => usePopularCodingTools(2), {
      wrapper: createQueryClientWrapper()
    });

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual(mockPopularTools);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/coding-tools/popular'), expect.anything());
  });

  it('should use default limit when no limit provided', async () => {
    // Mock a successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tools: mockCodingTools })
    });

    const { result } = renderHook(() => usePopularCodingTools(), {
      wrapper: createQueryClientWrapper()
    });

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual(mockCodingTools);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/coding-tools/popular'), expect.anything());
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch response
    const error = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePopularCodingTools(5), {
      wrapper: createQueryClientWrapper()
    });

    // Wait for the query to resolve with an error
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tools).toEqual([]);
    expect(result.current.error).toBeDefined();
  });
});
