import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Tag, ArrowLeft, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BlogPost } from "@shared/schema";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";

// Default image to use when a post doesn't have a featured image
const defaultImage = "/ctrlaltvibelogo.png";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch blog post by slug
  const { data: postData, isLoading, error } = useQuery({
    queryKey: ["/api/blog/posts/slug", slug],
    queryFn: () => apiRequest("GET", `/api/blog/posts/slug/${slug}`).then(res => res.json()),
  });
  
  // Increment view count on mount
  useEffect(() => {
    if (postData?.post?.id) {
      apiRequest("POST", `/api/blog/posts/${postData.post.id}/view`, {});
    }
  }, [postData?.post?.id]);
  
  // Handle error state
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Could not load the blog post. It may have been removed or doesn't exist.",
        variant: "destructive"
      });
      setLocation("/blog");
    }
  }, [error, toast, setLocation]);
  
  const post = postData?.post as BlogPost;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      ) : post ? (
        <>
          <SEO 
            title={`${post.title} | Ctrl Alt Vibe Blog`}
            description={post.summary}
            keywords={post.tags || []}
            image={post.featuredImage || defaultImage}
          />
          
          <div className="mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4"
              onClick={() => setLocation("/blog")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog
            </Button>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.createdAt), 'MMMM d, yyyy')}
              </div>
              
              {post.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author.username}
                </div>
              )}
              
              {post.category && (
                <Badge variant="outline">
                  {post.category.name}
                </Badge>
              )}
              
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount || 0} views
              </div>
            </div>
            
            {post.featuredImage && (
              <div className="mb-8">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="w-full h-auto rounded-lg shadow-md" 
                />
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none mb-8" 
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t pt-6 mt-8">
                <span className="font-medium text-gray-600 flex items-center mr-2">
                  <Tag className="h-4 w-4 mr-1" /> Tags:
                </span>
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {user?.role === 'admin' && (
              <div className="mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation(`/blog/edit/${post.id}`)}
                >
                  Edit Post
                </Button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default BlogPostPage;