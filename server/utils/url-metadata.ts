/**
 * URL metadata extraction utility for OpenGraph and other metadata
 */

import ogs from 'open-graph-scraper';
import cache from './cache';

export interface URLMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  url: string;
  siteName?: string;
  type?: string;
}

/**
 * Fetch metadata for a URL including OpenGraph tags
 * @param url URL to fetch metadata from
 * @returns Metadata including title, description, image, etc.
 */
export async function fetchURLMetadata(url: string): Promise<URLMetadata> {
  if (!url) {
    throw new Error('URL is required');
  }

  // Generate cache key based on URL
  const cacheKey = `url_metadata:${url}`;
  
  // Check cache first
  const cachedMetadata = cache.get<URLMetadata>(cacheKey);
  if (cachedMetadata) {
    return cachedMetadata;
  }

  try {
    const options = { url, timeout: 10000 };
    const { result } = await ogs(options);

    const metadata: URLMetadata = {
      url,
      title: result.ogTitle || result.twitterTitle || result.title,
      description: result.ogDescription || result.twitterDescription || result.description,
      imageUrl: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
      siteName: result.ogSiteName,
      type: result.ogType,
    };

    // Cache the result for 24 hours
    cache.set(cacheKey, metadata, { ttl: 24 * 60 * 60 * 1000 });

    return metadata;
  } catch (error) {
    console.error(`Error fetching metadata for URL ${url}:`, error);
    
    // Return basic data on error
    const basicMetadata: URLMetadata = { url };
    
    // Cache the basic metadata for a shorter period (1 hour)
    cache.set(cacheKey, basicMetadata, { ttl: 60 * 60 * 1000 });
    
    return basicMetadata;
  }
}

/**
 * Invalidate cached metadata for a specific URL
 * @param url URL to invalidate cache for
 */
export function invalidateURLMetadata(url: string): void {
  if (!url) return;
  
  const cacheKey = `url_metadata:${url}`;
  cache.delete(cacheKey);
}

/**
 * Invalidate all cached URL metadata
 */
export function invalidateAllURLMetadata(): void {
  // Basic cache doesn't have tag invalidation, so we can't use it directly
  // This would need enhancedCache if we want this functionality
}

/**
 * Process a URL for a project by extracting metadata
 * @param url URL to process for project information
 * @returns Object containing success status and metadata
 */
export async function processUrlForProject(url: string): Promise<{ 
  success: boolean; 
  title?: string; 
  description?: string; 
  imageUrl?: string;
  url: string;
}> {
  try {
    // Get metadata from URL
    const metadata = await fetchURLMetadata(url);
    
    return {
      success: true,
      title: metadata.title || '',
      description: metadata.description || '',
      imageUrl: metadata.imageUrl || '',
      url: metadata.url
    };
  } catch (error) {
    console.error(`Error processing URL for project: ${url}`, error);
    return {
      success: false,
      url
    };
  }
}
