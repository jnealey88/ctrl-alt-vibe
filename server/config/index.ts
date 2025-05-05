/**
 * Global configuration settings for the application
 */

// Default pagination settings
export const pagination = {
  defaultLimit: 20,
  maxLimit: 100
};

// Cache settings
export const cacheSettings = {
  // Default TTL in milliseconds
  defaultTTL: 60 * 1000, // 1 minute
  
  // TTLs for specific cache types
  ttl: {
    projects: {
      list: 2 * 60 * 1000,      // 2 minutes
      featured: 5 * 60 * 1000,  // 5 minutes
      trending: 5 * 60 * 1000,  // 5 minutes
      byId: 5 * 60 * 1000       // 5 minutes
    },
    blog: {
      list: 5 * 60 * 1000,      // 5 minutes
      byId: 5 * 60 * 1000,      // 5 minutes
      categories: 30 * 60 * 1000 // 30 minutes
    },
    tags: {
      popular: 10 * 60 * 1000,   // 10 minutes
      all: 15 * 60 * 1000        // 15 minutes
    },
    user: {
      profile: 2 * 60 * 1000     // 2 minutes
    }
  }
};

// API settings
export const api = {
  prefix: '/api',
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// File upload settings
export const uploads = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  resizeOptions: {
    project: {
      width: 800,
      height: 600,
      fit: 'inside' as const,
      withoutEnlargement: true
    },
    avatar: {
      width: 250,
      height: 250,
      fit: 'cover' as const
    },
    blog: {
      width: 1200,
      height: 675,
      fit: 'inside' as const,
      withoutEnlargement: true
    }
  }
};

// Open Graph metadata settings
export const openGraph = {
  defaultTitle: 'Ctrl Alt Vibe - Connect with Developers',
  defaultDescription: 'Discover and share amazing coding projects with the developer community.',
  defaultImage: '/public/social-share-image.svg',
  siteName: 'Ctrl Alt Vibe'
};

export default {
  pagination,
  cacheSettings,
  api,
  uploads,
  openGraph
};
