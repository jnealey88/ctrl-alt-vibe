import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/ProjectCard";
import FeaturedProject from "@/components/FeaturedProject";
import type { Project } from "@shared/schema";

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
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: [
      '/api/projects', 
      { page, tag: tagFilter, search: searchQuery, sort: sortBy, user: userFilter }
    ]
  });

  const projects: Project[] = projectsData?.projects || [];
  const hasMore = projectsData?.hasMore || false;
  
  // Fetch featured project
  const { data: featuredProjectData, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['/api/projects/featured']
  });

  const featuredProject: Project | null = featuredProjectData?.project || null;

  // Fetch popular tags
  const { data: tagsData } = useQuery({
    queryKey: ['/api/tags/popular']
  });

  const popularTags: string[] = tagsData?.tags || [];

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-secondary rounded-xl overflow-hidden mb-12">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1463 360">
            <path className="text-primary text-opacity-40" fill="currentColor" d="M-100 300 L200 0 L700 300 L1200 0 L1600 300" />
            <path className="text-secondary text-opacity-40" fill="currentColor" d="M-100 250 L400 50 L900 250 L1300 50 L1600 250" />
          </svg>
        </div>
        <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-20 lg:px-8">
          <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-white font-space">Showcase Your</span>
            <span className="block text-white font-space">AI-Powered Projects</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
            A community for developers to share their vibe coding projects and get feedback from peers.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
            <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
              <Link href="/">
                <Button variant="secondary" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8 w-full">
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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-space">{getPageTitle()}</h2>
          <p className="text-gray-500">Discover what the community is vibing with</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button 
              variant={activeTag === "all" ? "default" : "outline"}
              className={`rounded-full text-sm ${activeTag === "all" ? "bg-primary text-white" : "bg-white text-gray-700"}`}
              size="sm"
            >
              All
            </Button>
          </Link>
          
          {popularTags.map(tag => (
            <Link key={tag} href={`/?tag=${tag}`}>
              <Button 
                variant={activeTag === tag ? "default" : "outline"}
                className={`rounded-full text-sm ${activeTag === tag ? "bg-primary text-white" : "bg-white text-gray-700"}`}
                size="sm"
              >
                {tag}
              </Button>
            </Link>
          ))}
          
          {/* More button for future implementation */}
          {popularTags.length > 5 && (
            <div className="relative inline-block text-left">
              <Button variant="outline" className="rounded-full text-sm bg-white text-gray-700 flex items-center" size="sm">
                More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Project Grid */}
      {isLoadingProjects && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mb-16">
          <Button 
            variant="outline"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md shadow-sm hover:bg-gray-50"
            onClick={loadMoreProjects}
            disabled={isLoadingProjects}
          >
            {isLoadingProjects ? "Loading..." : "Load More Projects"}
          </Button>
        </div>
      )}

      {/* Featured Project */}
      {featuredProject && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground font-space">Featured Project</h2>
            <Link href="/?sort=featured">
              <a className="text-primary hover:text-primary/80 text-sm font-medium">
                View All Featured <ArrowRight className="ml-1 h-4 w-4 inline" />
              </a>
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

      {/* CTA */}
      <div className="bg-accent/10 rounded-xl p-8 text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-space mb-4">Ready to showcase your AI project?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Join our community of developers who are pushing the boundaries of what's possible with AI-assisted coding.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/submit">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md text-base font-medium inline-block">
              Submit Your Project
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-md text-base font-medium inline-block hover:bg-gray-50">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
