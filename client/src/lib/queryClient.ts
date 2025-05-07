import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean }
): Promise<Response> {
  const isFormData = options?.isFormData || false;
  
  console.log(`[API Request] ${method} ${url}`, { data });
  
  const headers: Record<string, string> = {};
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  try {
    console.log(`[API Request] Sending request with credentials`);
    
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`[API Request] Response status:`, res.status);
    
    if (!res.ok) {
      // Check content type to better handle HTML error responses
      const contentType = res.headers.get('content-type');
      console.log(`[API Request] Content-Type:`, contentType);
      
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await res.text();
        console.error(`[API Request] Received HTML instead of JSON:`, 
          htmlContent.substring(0, 200) + '...');
        throw new Error('Received HTML instead of JSON. You may need to re-authenticate.');
      }
    }

    await throwIfResNotOk(res);
    
    console.log(`[API Request] Request successful`);
    return res;
  } catch (error) {
    console.error(`[API Request] Error:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`[Query] Fetching: ${queryKey[0]}`);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`[Query] Response status: ${res.status}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('[Query] Received 401, returning null');
        return null;
      }
      
      // Check content type to better handle HTML error responses
      const contentType = res.headers.get('content-type');
      console.log(`[Query] Content-Type:`, contentType);
      
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await res.text();
        console.error(`[Query] Received HTML instead of JSON:`, 
          htmlContent.substring(0, 200) + '...');
        throw new Error('Received HTML instead of JSON. You may need to re-authenticate.');
      }
      
      await throwIfResNotOk(res);
      
      const data = await res.json();
      console.log(`[Query] Response data:`, data);
      return data;
    } catch (error) {
      console.error('[Query] Error in query function:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
