import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Tag, ArrowLeft, User, Eye, BookOpen, MessageCircle, Share2 } from "lucide-react";
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
          
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/blog")}
              className="transition-all hover:translate-x-[-5px]"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
              {user?.role === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation(`/blog/edit/${post.id}`)}
                >
                  Edit Post
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
            {post.featuredImage ? (
              <div className="h-[300px] overflow-hidden relative">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover" 
                />
                {post.category && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/80 hover:bg-white text-primary border-0 shadow-sm font-medium">
                      {post.category.name}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[120px] bg-gradient-to-r from-primary/10 to-primary/30 flex items-center justify-center relative">
                <BookOpen className="h-16 w-16 text-primary/40" />
                {post.category && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/80 hover:bg-white text-primary border-0 shadow-sm font-medium">
                      {post.category.name}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-600 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </div>
                
                {post.author && (
                  <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                    {post.author.username}
                  </div>
                )}
                
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                  <Eye className="h-4 w-4 text-primary" />
                  {post.viewCount || 0} views
                </div>
                
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  0 comments
                </div>
              </div>
              
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
                    <Badge key={index} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
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
          </div>
        </>
      ) : null}
    </div>
  );
};

export default BlogPostPage;