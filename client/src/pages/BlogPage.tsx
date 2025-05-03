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
import { Search, Calendar, Tag, Filter, BookOpen } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Blog | Ctrl Alt Vibe"
        description="Discover the latest insights, tutorials, and community stories on tech, coding, and the developer lifestyle."
        keywords={["blog", "tech blog", "programming", "development", "coding community"]}
      />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">The Ctrl Alt Vibe Blog</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Insights, tutorials, and community stories about tech, coding, and the developer lifestyle.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <div className="w-full md:w-auto flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Filter by:</span>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
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
            <Card key={post.id} className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg h-full flex flex-col" onClick={() => setLocation(`/blog/${post.slug}`)}>
              {post.featured_image && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.featured_image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out" 
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="group-hover:text-primary transition-colors duration-200">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  {post.category && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{post.category.name}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-grow">
                <p className="text-gray-600 line-clamp-3">{post.summary}</p>
              </CardContent>
              <CardFooter className="pt-0 pb-4">
                <div className="flex flex-wrap gap-2">
                  {post.tags && post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No blog posts found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || categoryFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Check back soon for new content!"}
          </p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setLocation("/blog", { replace: true });
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogPage;