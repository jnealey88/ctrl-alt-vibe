import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  BarChart3,
  ShieldCheck,
  Code2,
  Lightbulb,
  Zap,
  CheckCircle2,
} from "lucide-react";
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
          <Button
            variant="ghost"
            className="flex items-center text-primary hover:text-primary/90"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg overflow-hidden shadow-sm h-32 sm:h-28 md:h-24 animate-pulse flex"
            >
              <div className="w-1/3 sm:w-1/4 bg-gray-200"></div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden w-3/4">
                    <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 w-4 rounded-full bg-gray-200 ml-1"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded my-1"></div>
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-3 bg-gray-200 rounded w-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
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
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{
    projects: Project[];
    hasMore: boolean;
    total: number;
  }>({
    queryKey: [
      "/api/projects",
      {
        page,
        tag: tagFilter,
        search: searchQuery,
        sort: sortBy,
        user: userFilter,
      },
    ],
  });

  const projects = projectsData?.projects || [];
  const hasMore = projectsData?.hasMore || false;

  // Fetch featured project
  const { data: featuredProjectData, isLoading: isLoadingFeatured } = useQuery<{
    project: Project;
  }>({
    queryKey: ["/api/projects/featured"],
  });

  const featuredProject = featuredProjectData?.project || null;

  // Fetch popular tags
  const { data: tagsData } = useQuery<{ tags: string[] }>({
    queryKey: ["/api/tags/popular"],
  });

  const popularTags = tagsData?.tags || [];

  const loadMoreProjects = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const getPageTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (userFilter) return `Projects by ${userFilter}`;
    if (tagFilter) return `${tagFilter} Projects`;

    switch (sortBy) {
      case "latest":
        return "Latest Projects";
      case "popular":
        return "Popular Projects";
      default:
        return "Trending Projects";
    }
  };

  // Define SEO metadata for the homepage
  const seoKeywords = [
    "AI-assisted coding",
    "developer projects",
    "coding showcase",
    "programming community",
    "developer portfolio",
    "AI tools",
    "tech projects",
    "coding collaboration",
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO
        title="Your Professional AI Coding Portfolio | Vibe Coded Projects"
        description="Build a standout portfolio of your vibe coded projects to showcase your AI development skills to potential employers. Create a professional profile that gets you noticed."
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
            <span className="block text-white font-space">
              Build Your Portfolio of
            </span>
            <span className="block text-white font-space">
              Vibe Coded Projects
            </span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
            Create an impressive showcase of your AI-powered coding projects
            that demonstrates your skill and creativity to employers, clients,
            and peers.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
            <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
              <Link href="/browse">
                <Button
                  variant="secondary"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8 w-full mb-4 sm:mb-0"
                >
                  Browse Projects
                </Button>
              </Link>
              <Link href="/submit">
                <Button
                  variant="default"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white sm:px-8 w-full"
                >
                  Submit Your Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Check Promotion */}
      <div className="mb-16 bg-gradient-to-r from-violet-50 via-indigo-50 to-violet-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl overflow-hidden shadow-md border border-indigo-100 dark:border-slate-700">
        <div className="grid md:grid-cols-2 items-center">
          {/* Left side - Content */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="inline-block bg-violet-100 dark:bg-violet-900/30 p-2 rounded-full mb-4">
              <Brain className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-white">
              Does it pass the vibe check?
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Get comprehensive AI-powered analysis for your project idea. Our
              in-depth evaluation covers market fit, target audience, plus
              detailed guidance on launch strategy, customer acquisition,
              revenue models, and funding options.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Market Analysis
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Validate demand and opportunities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Business Model
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Revenue strategies and planning
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Target Audience
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Define your ideal users
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Technical Assessment
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Feasibility and implementation
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Launch Strategy
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Time-to-market and MVP guidance
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Revenue Generation
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Pricing and business models
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Bootstrapping Guide
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    DIY solutions for solo developers
                  </p>
                </div>
              </div>
            </div>
            <Link href="/vibe-check">
              <Button className="w-full sm:w-auto" size="lg">
                <Zap className="mr-2 h-5 w-5" />
                Get Your Free Vibe Check
              </Button>
            </Link>
          </div>

          {/* Right side - Decorative */}
          <div className="hidden md:block relative h-full bg-indigo-100/50 dark:bg-slate-800 p-8">
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#5558a4_1px,transparent_1px)] [background-size:20px_20px]"></div>
            </div>
            <div className="relative h-full flex flex-col justify-center items-center space-y-6">
              <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg p-5 w-full max-w-xs transform rotate-3 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-1">
                    <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    87/100
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Market Fit Score
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Strong potential with some competition
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mb-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                    style={{ width: "87%" }}
                  ></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg p-5 w-full max-w-xs transform -rotate-2 relative z-20">
                <div className="flex items-center mb-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-md p-1 mr-3">
                    <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Business Model
                  </h3>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc">
                  <li>Freemium with premium features</li>
                  <li>Enterprise partnerships</li>
                  <li>White label licensing opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-space">
            {getPageTitle()}
          </h2>
          <p className="text-gray-500">
            Discover what the community is vibing with
          </p>
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

          {popularTags.map((tag) => (
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
              <Button
                variant="outline"
                className="rounded-full text-sm flex items-center"
                size="sm"
              >
                More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Project Grid */}
      {isLoadingProjects && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg overflow-hidden shadow-sm h-32 sm:h-28 md:h-24 animate-pulse flex"
            >
              <div className="w-1/3 sm:w-1/4 bg-gray-200"></div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden w-3/4">
                    <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 w-4 rounded-full bg-gray-200 ml-1"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded my-1"></div>
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-3 bg-gray-200 rounded w-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 && page === 1 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm mb-12">
          <div className="text-center">
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No projects found
            </h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {projects.map((project) => (
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

      {/* Explore More Projects CTA section removed */}

      {/* Profile Sharing Banner */}
      <div className="mb-24 bg-gray-900 text-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-5 items-stretch">
          {/* Left side - decorative */}
          <div className="hidden md:block md:col-span-2 bg-gradient-to-br from-primary/80 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-300 rounded-full blur-xl"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-32 w-32 text-white/90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
          </div>

          {/* Right side - content */}
          <div className="p-8 md:p-10 md:col-span-3">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-space">
              Your Vibe Coded Portfolio
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Build a professional, AI-enhanced portfolio that stands out from
              traditional resumes. Get a personalized URL you can share with
              employers, clients, and on your social profiles to showcase your
              innovative skills.
            </p>

            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center">
                <div className="bg-primary/20 p-2 rounded mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <code className="text-sm text-gray-300 font-mono">
                  https://ctrlaltvibe.dev/profile/
                  <span className="text-white font-bold">
                    {user ? user.username : "your-username"}
                  </span>
                </code>
              </div>

              <div className="flex gap-3">
                <Link href="/profile" className="flex-1">
                  <Button variant="default" className="w-full">
                    View Your Profile
                  </Button>
                </Link>
                <Link href="/submit" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 bg-gray-700 text-white hover:text-white hover:bg-gray-600"
                  >
                    Submit a Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Projects Section is already shown at the top */}

      {/* Featured project section has been hidden */}

      {/* Vibe Coding Platforms */}
      <div className="mb-24">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-space mb-6 text-center">
          Popular AI Coding Platforms
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-12 text-center">
          Discover the tools that are revolutionizing how developers build
          software with AI assistance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-primary"
              >
                <path
                  fill="currentColor"
                  d="M12.265 2C6.246 2 1.378 6.92 1.378 12.938c0 6.02 4.87 10.94 10.887 10.94 6.02 0 10.887-4.92 10.887-10.94C23.152 6.92 18.285 2 12.265 2zm0 19.735c-4.875 0-8.795-3.92-8.795-8.797 0-4.877 3.92-8.798 8.795-8.798 4.877 0 8.797 3.92 8.797 8.798 0 4.876-3.92 8.797-8.797 8.797z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Replit</h3>
            <p className="text-gray-600 text-center mb-4">
              An all-in-one collaborative browser IDE with AI features for
              coding and learning.
            </p>
            <a
              href="https://replit.com/refer/justin488"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              replit.com
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-purple-600"
              >
                <path
                  fill="currentColor"
                  d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">GitHub Copilot</h3>
            <p className="text-gray-600 text-center mb-4">
              AI pair programming tool that offers code suggestions as you type.
            </p>
            <a
              href="https://github.com/features/copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              github.com/features/copilot
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-pink-600"
              >
                <path
                  fill="currentColor"
                  d="M17.655 7.898c-2.096 0-3.887 1.335-4.552 3.54-1.258-3.5-2.908-4.858-4.84-4.858-1.842 0-3.462 1.035-4.263 2.94V7.732H1v13h3v-8.457c0-2.285.98-3.586 2.878-3.586 1.69 0 2.493 1.275 2.493 2.85V20.73h3v-8.19c0-2.286.98-3.587 2.878-3.587 1.691 0 2.493 1.276 2.493 2.851v8.928h3V11.16c0-2.066-1.377-3.263-3.087-3.263z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Magic Patterns</h3>
            <p className="text-gray-600 text-center mb-4">
              Generate high-quality UI components with AI-powered tools.
            </p>
            <a
              href="https://magicpatterns.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              magicpatterns.com
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-green-600"
              >
                <path
                  fill="currentColor"
                  d="M5 5v14h14V5H5zM4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Cursor</h3>
            <p className="text-gray-600 text-center mb-4">
              AI-powered code editor built for pair programming with AI.
            </p>
            <a
              href="https://cursor.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              cursor.sh
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-yellow-600"
              >
                <path
                  fill="currentColor"
                  d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bolt</h3>
            <p className="text-gray-600 text-center mb-4">
              Build web apps faster with AI assistance and predefined templates.
            </p>
            <a
              href="https://bolt.new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              bolt.new
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover-card-animation">
            <div className="h-14 w-14 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-red-600"
              >
                <path
                  fill="currentColor"
                  d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Lovable</h3>
            <p className="text-gray-600 text-center mb-4">
              AI platform for creating engaging user experiences quickly.
            </p>
            <a
              href="https://lovable.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              lovable.dev
            </a>
          </div>
        </div>
      </div>

      {/* AI-Powered Project Evaluation Feature Section */}
      <div className="mb-20 border border-primary/20 rounded-xl overflow-hidden bg-gradient-to-r from-gray-50 to-sky-50 dark:from-gray-900 dark:to-slate-900">
        <div className="grid md:grid-cols-2 items-stretch">
          {/* Left side - content */}
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-6">
              <Brain className="h-4 w-4 mr-2" />
              New Feature
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-space">
              AI-Powered Project Evaluations
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get comprehensive business insights and technical feasibility
              analysis for your vibe coded projects — tailored specifically for
              solo developers using AI-assisted coding.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-full">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Business Viability</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Market analysis, target audience profiling, and business
                    plan generation
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-full">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">
                    Security Implementation Guidance
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Vibe coding security considerations, API protection
                    strategies, and authentication best practices
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-full">
                  <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Technical Feasibility</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Specialized guidance on vibe coding considerations and
                    AI-assisted implementation
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-rose-50 dark:bg-rose-900/30 p-2 rounded-full">
                  <Lightbulb className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">
                    Implementation Roadmap
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Phased timelines with specific tasks and success metrics
                    optimized for solo developers
                  </p>
                </div>
              </div>
            </div>

            <Link href="/submit">
              <Button variant="default" className="px-6">
                Create a Project to Try It
              </Button>
            </Link>
          </div>

          {/* Right side - image */}
          <div className="hidden md:block bg-gradient-to-br from-primary-600 to-blue-700 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-200 rounded-full blur-xl"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-2xl p-6 overflow-hidden">
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="ml-3 font-bold text-lg">
                      Project Evaluation
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  <div className="pt-2"></div>
                  <div className="h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800 p-3">
                    <div className="h-3 bg-emerald-200 dark:bg-emerald-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-emerald-200 dark:bg-emerald-700 rounded w-5/6"></div>
                    <div className="h-3 bg-emerald-200 dark:bg-emerald-700 rounded w-4/6 mt-2"></div>
                  </div>
                  <div className="pt-2"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-blue-50 dark:bg-blue-900/20 rounded"></div>
                    <div className="h-8 bg-purple-50 dark:bg-purple-900/20 rounded"></div>
                    <div className="h-8 bg-amber-50 dark:bg-amber-900/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-accent/10 rounded-xl p-8 pb-10 text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-space mb-4">
          Build Your Professional Vibe Coded Portfolio
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Showcase your AI coding skills and stand out to potential employers
          with a dynamic portfolio of your vibe coded projects. Get discovered
          by companies looking for developers who can leverage AI effectively.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/submit">
            <Button
              variant="default"
              className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white sm:px-8 w-full"
            >
              Submit Your Project
            </Button>
          </Link>
          <Link href="/browse">
            <Button
              variant="secondary"
              className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8 w-full mb-4 sm:mb-0"
            >
              Browse Projects
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
