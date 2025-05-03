import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/ProjectCard";
import FeaturedProject from "@/components/FeaturedProject";
import SEO from "@/components/SEO";
import type { Project } from "@shared/schema";

// Component for Trending Projects Section
const TrendingProjects = () => {
  const { data, isLoading } = useQuery<{ projects: Project[] }>({  
    queryKey: ["/api/projects/trending"],
  });

  const trendingProjects = data?.projects || [];

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trending Projects</h2>
        <Link href="/browse?sort=trending">
          <Button variant="ghost" className="flex items-center text-primary hover:text-primary/90">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-card animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProjects.map(project => (
            <ProjectCard key={project.id} project={project} className="h-full" />
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [location] = useLocation();
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string>("all");
  
  // Parse query params
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const searchQuery = searchParams.get("search") || "";
  const tagFilter = searchParams.get("tag") || "";
  const sortBy = searchParams.get("sort") || "trending";
  const userFilter = searchParams.get("user") || "";

  useEffect(() => {
    if (tagFilter) {
      setActiveTag(tagFilter);
    } else {
      setActiveTag("all");
    }
    // Reset page when filters change
    setPage(1);
  }, [tagFilter, searchQuery, sortBy, userFilter]);

  // Fetch projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{ projects: Project[], hasMore: boolean, total: number }>({  
    queryKey: [
      '/api/projects', 
      { page, tag: tagFilter, search: searchQuery, sort: sortBy, user: userFilter }
    ]
  });

  const projects = projectsData?.projects || [];
  const hasMore = projectsData?.hasMore || false;
  
  // Fetch featured project
  const { data: featuredProjectData, isLoading: isLoadingFeatured } = useQuery<{ project: Project }>({  
    queryKey: ['/api/projects/featured']
  });

  const featuredProject = featuredProjectData?.project || null;

  // Fetch popular tags
  const { data: tagsData } = useQuery<{ tags: string[] }>({  
    queryKey: ['/api/tags/popular']
  });

  const popularTags = tagsData?.tags || [];

  const loadMoreProjects = () => {
    setPage(prevPage => prevPage + 1);
  };

  const getPageTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (userFilter) return `Projects by ${userFilter}`;
    if (tagFilter) return `${tagFilter} Projects`;
    
    switch (sortBy) {
      case "latest": return "Latest Projects";
      case "popular": return "Popular Projects";
      default: return "Trending Projects";
    }
  };

  // Define SEO metadata for the homepage
  const seoKeywords = [
    'AI-assisted coding', 'developer projects', 'coding showcase',
    'programming community', 'developer portfolio', 'AI tools',
    'tech projects', 'coding collaboration'
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO 
        title="AI-Assisted Coding Projects Community"
        description="Discover, share, and engage with innovative AI-assisted coding projects from the developer community. Showcase your work and connect with fellow developers."
        keywords={seoKeywords}
      />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 rounded-xl overflow-hidden mb-16 shadow-xl">
        {/* Modern geometric pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-500 rounded-full blur-2xl"></div>
            <div className="absolute top-20 right-20 w-40 h-40 bg-purple-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-1/4 w-60 h-30 bg-pink-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/3 w-30 h-30 bg-blue-600 rounded-full blur-2xl"></div>
          </div>
        </div>
        <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-20 lg:px-8">
          <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-white font-space">Showcase Your</span>
            <span className="block text-white font-space">AI-Powered Projects</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
            A community for people to share their vibe coding projects and get feedback from peers.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
            <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
              <Link href="/browse">
                <Button variant="secondary" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8 w-full mb-4 sm:mb-0">
                  Browse Projects
                </Button>
              </Link>
              <Link href="/submit">
                <Button variant="default" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white sm:px-8 w-full">
                  Submit Your Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-space">{getPageTitle()}</h2>
          <p className="text-gray-500">Discover what the community is vibing with</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/browse">
            <Button 
              variant={activeTag === "all" ? "default" : "outline"}
              className="rounded-full text-sm"
              size="sm"
            >
              All
            </Button>
          </Link>
          
          {popularTags.map(tag => (
            <Link key={tag} href={`/browse?tag=${tag}`}>
              <Button 
                variant={activeTag === tag ? "default" : "outline"}
                className="rounded-full text-sm"
                size="sm"
              >
                {tag}
              </Button>
            </Link>
          ))}
          
          {/* More button for future implementation */}
          {popularTags.length > 5 && (
            <div className="relative inline-block text-left">
              <Button variant="outline" className="rounded-full text-sm flex items-center" size="sm">
                More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Project Grid */}
      {isLoadingProjects && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-card animate-pulse">
              <div className="h-48 w-full bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 && page === 1 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm mb-12">
          <div className="text-center">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? `No projects match your search "${searchQuery}"` 
                : tagFilter 
                  ? `No projects with the tag "${tagFilter}"` 
                  : userFilter 
                    ? `${userFilter} hasn't submitted any projects yet`
                    : "There are no projects yet"}
            </p>
          </div>
          <div className="mt-6">
            <Link href="/submit">
              <Button>Submit a Project</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mb-20">
          <Button 
            variant="outline"
            className="px-6 py-3 rounded-md shadow-sm"
            onClick={loadMoreProjects}
            disabled={isLoadingProjects}
          >
            {isLoadingProjects ? "Loading..." : "Load More Projects"}
          </Button>
        </div>
      )}

      {/* Explore More Projects CTA */}
      <div className="flex flex-col items-center mb-24 text-center py-8 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Discover More AI-Powered Projects</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Browse our collection of AI-assisted coding projects, filter by tags, search for specific technologies, or sort by popularity.
        </p>
        <Link href="/browse">
          <Button className="px-8 py-3" size="lg">
            Explore Project Gallery
          </Button>
        </Link>
      </div>
      
      {/* Trending Projects Section is already shown at the top */}

      {/* Featured Project */}
      {featuredProject && (
        <div className="mb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground font-space">Featured Project</h2>
            <Link href="/browse?sort=featured" className="text-primary hover:text-primary/80 text-sm font-medium">
              View All Featured <ArrowRight className="ml-1 h-4 w-4 inline" />
            </Link>
          </div>
          
          {isLoadingFeatured ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-card lg:flex animate-pulse">
              <div className="lg:w-1/2 h-72 bg-gray-200"></div>
              <div className="p-8 lg:w-1/2">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-24 bg-gray-200 rounded mb-6"></div>
                <div className="flex gap-2 mb-6">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="flex gap-4">
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ) : (
            <FeaturedProject project={featuredProject} />
          )}
        </div>
      )}

      {/* Vibe Coding Platforms */}
      <div className="mb-24">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-space mb-6 text-center">Popular AI Coding Platforms</h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-12 text-center">
          Discover the tools that are revolutionizing how developers build software with AI assistance.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
                <path fill="currentColor" d="M12.265 2C6.246 2 1.378 6.92 1.378 12.938c0 6.02 4.87 10.94 10.887 10.94 6.02 0 10.887-4.92 10.887-10.94C23.152 6.92 18.285 2 12.265 2zm0 19.735c-4.875 0-8.795-3.92-8.795-8.797 0-4.877 3.92-8.798 8.795-8.798 4.877 0 8.797 3.92 8.797 8.798 0 4.876-3.92 8.797-8.797 8.797z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Replit</h3>
            <p className="text-gray-600 text-center mb-4">An all-in-one collaborative browser IDE with AI features for coding and learning.</p>
            <a href="https://replit.com/refer/justin488" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">replit.com</a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-purple-600">
                <path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">GitHub Copilot</h3>
            <p className="text-gray-600 text-center mb-4">AI pair programming tool that offers code suggestions as you type.</p>
            <a href="https://github.com/features/copilot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">github.com/features/copilot</a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-pink-600">
                <path fill="currentColor" d="M17.655 7.898c-2.096 0-3.887 1.335-4.552 3.54-1.258-3.5-2.908-4.858-4.84-4.858-1.842 0-3.462 1.035-4.263 2.94V7.732H1v13h3v-8.457c0-2.285.98-3.586 2.878-3.586 1.69 0 2.493 1.275 2.493 2.85V20.73h3v-8.19c0-2.286.98-3.587 2.878-3.587 1.691 0 2.493 1.276 2.493 2.851v8.928h3V11.16c0-2.066-1.377-3.263-3.087-3.263z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Magic Patterns</h3>
            <p className="text-gray-600 text-center mb-4">Generate high-quality UI components with AI-powered tools.</p>
            <a href="https://magicpatterns.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">magicpatterns.com</a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-green-600">
                <path fill="currentColor" d="M5 5v14h14V5H5zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Cursor</h3>
            <p className="text-gray-600 text-center mb-4">AI-powered code editor built for pair programming with AI.</p>
            <a href="https://cursor.sh" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">cursor.sh</a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-yellow-600">
                <path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bolt</h3>
            <p className="text-gray-600 text-center mb-4">Build web apps faster with AI assistance and predefined templates.</p>
            <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">bolt.new</a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-red-600">
                <path fill="currentColor" d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Lovable</h3>
            <p className="text-gray-600 text-center mb-4">AI platform for creating engaging user experiences quickly.</p>
            <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">lovable.dev</a>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-accent/10 rounded-xl p-8 pb-10 text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-space mb-4">Ready to showcase your AI project?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Join our community of people who are pushing the boundaries of what's possible with AI-assisted coding.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/submit">
            <Button variant="default" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white sm:px-8 w-full">
              Submit Your Project
            </Button>
          </Link>
          <Link href="/browse">
            <Button variant="secondary" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8 w-full mb-4 sm:mb-0">
              Browse Projects
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
