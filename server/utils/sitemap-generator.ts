import { storage } from '../storage';
import fs from 'fs';
import path from 'path';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generates a sitemap.xml file with static and dynamic URLs
 */
export async function generateSitemap(): Promise<string> {
  const staticUrls: SitemapEntry[] = [
    { url: '/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 1.0 },
    { url: '/browse', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
    { url: '/blog', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
    { url: '/login', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
    { url: '/register', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
    { url: '/about', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.6 },
  ];

  // Get projects (only public ones)
  const projects = await storage.getProjects({ 
    limit: 1000, // Get a large number to include most projects
  });
  
  const projectUrls: SitemapEntry[] = projects.projects
    .filter(project => !project.isPrivate) // Only include public projects
    .map(project => ({
      url: `/project/${project.id}`,
      lastmod: new Date(project.updatedAt).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    }));

  // Get blog posts
  let blogUrls: SitemapEntry[] = [];
  try {
    const blogPosts = await storage.getBlogPosts({ 
      limit: 1000, // Get a large number to include most posts
    });

    blogUrls = blogPosts.posts.map(post => ({
      url: `/blog/${post.slug}`,
      lastmod: new Date(post.updatedAt).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    // Continue without blog posts if they're not available
  }

  // Combine all URLs
  const allUrls = [...staticUrls, ...projectUrls, ...blogUrls];

  // Generate the XML
  const host = 'https://ctrlaltvibe.com';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  allUrls.forEach((entry) => {
    xml += '  <url>\n';
    xml += `    <loc>${host}${entry.url}</loc>\n`;
    if (entry.lastmod) {
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }
    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }
    if (entry.priority !== undefined) {
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Writes the sitemap.xml file to the public directory
 */
export async function writeSitemap(): Promise<void> {
  try {
    const xml = await generateSitemap();
    const publicPath = path.resolve(process.cwd(), 'public');
    const filePath = path.join(publicPath, 'sitemap.xml');
    
    fs.writeFileSync(filePath, xml);
    console.log(`Sitemap generated successfully at ${filePath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}
