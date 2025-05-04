import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Calendar, Tag, Filter, BookOpen, User } from "lucide-react";
import { BlogPost, BlogCategory } from "@shared/schema";
import SEO from "@/components/SEO";

const BlogPage = () => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Extract search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const category = params.get("category");
    
    if (search) setSearchQuery(search);
    if (category) setCategoryFilter(category);
  }, []);
  
  // Fetch blog posts with filters
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/blog/posts", searchQuery, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      return apiRequest("GET", `/api/blog/posts?${params.toString()}`).then(res => res.json());
    },
  });
  
  // Fetch blog categories for filter
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/blog/categories"],
    queryFn: () => apiRequest("GET", "/api/blog/categories").then(res => res.json()),
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    setLocation(`/blog${queryString}`, { replace: true });
  };
  
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (value && value !== "all") params.append("category", value);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    setLocation(`/blog${queryString}`, { replace: true });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <SEO 
        title="Blog | Ctrl Alt Vibe"
        description="Discover the latest insights, tutorials, and community stories on tech, coding, and the developer lifestyle."
        keywords={["blog", "tech blog", "programming", "development", "coding community"]}
      />
      
      <div className="text-center mb-12">
        <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-4 font-medium text-sm">
          <BookOpen className="h-4 w-4 inline-block mr-1" /> Our Latest Content
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          The Ctrl Alt Vibe Blog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Insights, tutorials, and community stories about tech, coding, and the developer lifestyle.
        </p>
      </div>
      
      <div className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 p-5 sm:p-6 rounded-xl shadow-sm border border-primary/10">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="pl-9 border-primary/20 bg-white/80 focus-visible:ring-primary/50 shadow-sm w-full"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          <div className="w-full flex gap-2">
            <div className="hidden sm:flex items-center bg-white/80 px-3 py-1.5 rounded-l-md border border-r-0 border-primary/20 shadow-sm">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm ml-2 font-medium">Category</span>
            </div>
            <div className="sm:hidden flex items-center bg-white/80 px-3 py-1.5 rounded-l-md border border-r-0 border-primary/20 shadow-sm">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-l-none border-primary/20 bg-white/80 shadow-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px] overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : categoriesData?.categories?.map((category: BlogCategory) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {(searchQuery || categoryFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-primary/10">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="bg-white hover:bg-gray-50 text-gray-700 gap-1 shadow-sm border border-primary/10">
                <Search className="h-3 w-3" />
                {searchQuery}
                <button className="ml-1 hover:text-primary font-bold" onClick={() => {
                  setSearchQuery("");
                  const params = new URLSearchParams();
                  if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
                  const queryString = params.toString() ? `?${params.toString()}` : "";
                  setLocation(`/blog${queryString}`, { replace: true });
                }}>×</button>
              </Badge>
            )}
            {categoryFilter !== "all" && categoriesData?.categories && (
              <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary gap-1 shadow-sm border border-primary/10">
                <Filter className="h-3 w-3" />
                {categoriesData.categories.find((c: BlogCategory) => c.slug === categoryFilter)?.name || categoryFilter}
                <button className="ml-1 hover:text-primary/80 font-bold" onClick={() => {
                  setCategoryFilter("all");
                  const params = new URLSearchParams();
                  if (searchQuery) params.append("search", searchQuery);
                  const queryString = params.toString() ? `?${params.toString()}` : "";
                  setLocation(`/blog${queryString}`, { replace: true });
                }}>×</button>
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setLocation("/blog", { replace: true });
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
      
      {postsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 rounded-t-lg">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : postsData?.posts?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsData.posts.map((post: BlogPost) => (
            <Card key={post.id} className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl h-full flex flex-col border-0 shadow" onClick={() => setLocation(`/blog/${post.slug}`)}>
              <div className="relative">
                {post.featuredImage ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out" 
                      onError={(e) => {
                        // If image fails to load, show the fallback
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/10', 'to-primary/30', 'flex', 'items-center', 'justify-center');
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary/60"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
                        e.currentTarget.parentElement?.appendChild(icon);
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-primary/60" />
                  </div>
                )}
                {post.category && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/80 hover:bg-white text-primary border-0 shadow-sm font-medium">
                      {post.category.name}
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="group-hover:text-primary transition-colors duration-200 line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  {post.author && (
                    <>
                      <span className="mx-1">•</span>
                      <User className="h-3 w-3 mr-1" />
                      {post.author.username}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-grow">
                <p className="text-gray-600 line-clamp-3">{post.summary}</p>
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {post.tags && post.tags.length > 0 && post.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                  {post.tags && post.tags.length > 2 && (
                    <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">+{post.tags.length - 2}</Badge>
                  )}
                </div>
                <div className="flex items-center text-primary/70 font-medium text-sm group-hover:text-primary transition-colors">
                  Read More
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl shadow-sm border border-primary/10 p-8">
          <div className="bg-white/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/10">
            <BookOpen className="h-12 w-12 text-primary/60" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-gray-800">No blog posts found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || categoryFilter !== "all" 
              ? "No posts match your current search or filter criteria. Try adjusting your search terms or selecting a different category."
              : "We're working on adding new content to our blog. Check back soon for fresh insights and tutorials!"}
          </p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button 
              variant="outline" 
              className="border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200 shadow-sm"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setLocation("/blog", { replace: true });
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogPage;