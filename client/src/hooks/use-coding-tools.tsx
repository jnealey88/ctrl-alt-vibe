import { useQuery } from "@tanstack/react-query";
import type { CodingTool } from "@shared/schema";

export function useCodingTools() {
  const { data, isLoading, error } = useQuery<{ tools: CodingTool[] }>({
    queryKey: ["/api/coding-tools"],
  });

  return {
    tools: data?.tools || [],
    isLoading,
    error,
  };
}

export function usePopularCodingTools(limit: number = 10) {
  const { data, isLoading, error } = useQuery<{ tools: CodingTool[] }>({
    queryKey: ["/api/coding-tools/popular", limit],
  });

  return {
    tools: data?.tools || [],
    isLoading,
    error,
  };
}
