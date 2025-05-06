import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ExternalLink, 
  Heart, 
  Share2, 
  Bookmark,
  Edit,
  MessageSquare,
  Eye,
  Calendar,
  BadgeCheck,
  ArrowLeft,
  Cpu,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommentSection from "@/components/CommentSection";
import ImageGallery from "@/components/ImageGallery";
import SEO from "@/components/SEO";
import type { Project, ProjectGalleryImage } from "@shared/schema";

const ProjectDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("details");
  const [projectUrlCopied, setProjectUrlCopied] = useState<boolean>(false);
  
  // Fetch project details
  const { data, isLoading, error } = useQuery<{project: Project}>({
    queryKey: [`/api/projects/${id}`],
  });
  
  const project: Project | undefined = data?.project;
  
  // Fetch gallery images for the project
  const { data: galleryData } = useQuery<{galleryImages: ProjectGalleryImage[]}>({    
    queryKey: [`/api/projects/${id}/gallery`],
    enabled: !!project, // Only fetch gallery if project exists
    // Use custom query function to handle content type issues
    queryFn: async () => {
      try {
        const response = await fetch(`/api/projects/${id}/gallery`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Gallery API returned non-JSON response:', contentType);
          return { galleryImages: [] };
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch gallery images');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error in gallery fetch:', error);
        return { galleryImages: [] };
      }
    }
  });
  
  const galleryImages = galleryData?.galleryImages || [];
  
  // Debug log for gallery images
  useEffect(() => {
    if (galleryData) {
      console.log(`Loaded ${galleryImages.length} gallery images for project ${id}`);
    }
  }, [galleryData, galleryImages.length, id]);
  
  // Check if the current user is the author of the project
  const isAuthor = user && project && user.id === project.author.id;
  
  // Record view on component mount
  useEffect(() => {
    const recordView = async () => {
      try {
        await apiRequest("POST", `/api/projects/${id}/view`, {});
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    };
    
    if (id) {
      recordView();
    }
  }, [id, queryClient]);
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${id}/like`, { liked: !(project?.isLiked) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: project?.isLiked ? "Project unliked" : "Project liked",
        description: project?.isLiked ? "You have unliked this project" : "You have liked this project",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like project. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${id}/bookmark`, { bookmarked: !(project?.isBookmarked) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({
        title: project?.isBookmarked ? "Bookmark removed" : "Project bookmarked",
        description: project?.isBookmarked ? "Project removed from your bookmarks" : "Project added to your bookmarks",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to bookmark project. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: project?.title,
          text: project?.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Project link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  
  const handleCopyProjectUrl = async () => {
    try {
      await navigator.clipboard.writeText(project?.projectUrl || "");
      setProjectUrlCopied(true);
      toast({
        title: "URL copied",
        description: "Project URL copied to clipboard"
      });
      
      setTimeout(() => {
        setProjectUrlCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Error copying URL:", error);
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16 animate-pulse">
          <div className="h-80 bg-gray-200 w-full"></div>
          <div className="p-8">
            <div className="flex justify-between mb-6">
              <div className="space-y-2 w-2/3">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="h-10 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>Return to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric' 
    }).format(date);
  };
  
  // Generate keywords based on project tags and title
  const seoKeywords = [
    ...project.tags,
    'AI project', 'coding project', 'developer showcase',
    'programming', 'tech project', project.vibeCodingTool || 'AI assisted'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title={project.title}
        description={project.description}
        image={project.imageUrl}
        article={true}
        keywords={seoKeywords}
      />
      
      {/* Back button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16">
        {/* Hero section with image and floating action buttons */}
        <div className="relative">
          <div className="w-full h-80 bg-gray-100 relative overflow-hidden">
            <img 
              className="w-full h-full object-cover object-top" 
              src={project.imageUrl} 
              alt={project.title}
              onError={(e) => {
                // Set a fallback image if the image fails to load
                e.currentTarget.src = '/ctrlaltvibelogo.png';
                e.currentTarget.classList.add('object-contain', 'p-4');
                e.currentTarget.classList.remove('object-cover', 'object-top');
              }}
            />
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="bg-white/90 hover:bg-white rounded-full text-gray-700 h-10 w-10 shadow-md transition-all hover:scale-105"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className={`bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md transition-all hover:scale-105 ${project.isLiked ? 'text-secondary' : 'text-gray-700'}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${project.isLiked ? 'fill-secondary' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className={`bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md transition-all hover:scale-105 ${project.isBookmarked ? 'text-gray-800' : 'text-gray-700'}`}
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
            >
              <Bookmark className={`h-5 w-5 ${project.isBookmarked ? 'fill-gray-800' : ''}`} />
            </Button>
          </div>
          
          {/* Featured badge if the project is featured */}
          {project.featured && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 pl-2 pr-3 py-1.5 flex items-center gap-1 border border-amber-200 shadow-md">
                <BadgeCheck className="h-4 w-4 fill-amber-500 stroke-amber-700" />
                Featured Project
              </Badge>
            </div>
          )}
          
          {/* Author avatar positioned at the bottom edge of the image */}
          <div className="absolute -bottom-6 left-8">
            <Avatar className="h-12 w-12 ring-4 ring-white rounded-full shadow-lg">
              {project.author.avatarUrl ? (
                <AvatarImage src={project.author.avatarUrl} alt={project.author.username} />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary">
                  {project.author.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-8 pt-10">
          {/* Project info section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-space mb-2">{project.title}</h1>
                  <p className="text-gray-500 mb-4">
                    By <Link href={`/profile/${project.author.username}`} className="text-primary hover:underline font-medium">{project.author.username}</Link> • {formatDate(project.createdAt)}
                  </p>
                </div>
                
                <div className="hidden md:flex md:space-x-3">
                  <a 
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center transition-all hover:translate-y-[-2px] shadow-sm"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Visit Project
                  </a>
                  {isAuthor && (
                    <Link href={`/projects/${id}/edit`}>
                      <Button 
                        variant="secondary"
                        className="text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all hover:translate-y-[-2px] shadow-sm"
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map(tag => (
                  <Link key={tag} href={`/?tag=${tag}`} className="no-underline">
                    <span>
                      <Badge variant="outline" className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        {tag}
                      </Badge>
                    </span>
                  </Link>
                ))}
                
                {project.vibeCodingTool && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200 transition-colors flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    {project.vibeCodingTool}
                  </Badge>
                )}
              </div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-lg font-bold">{project.viewsCount || 0}</p>
                    </div>
                    <Eye className="h-5 w-5 text-blue-500" />
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-lg font-bold">{project.likesCount || 0}</p>
                    </div>
                    <Heart className={`h-5 w-5 text-red-500 ${project.isLiked ? 'fill-red-500' : ''}`} />
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-lg font-bold">{project.commentsCount || 0}</p>
                    </div>
                    <MessageSquare className="h-5 w-5 text-green-500" />
                  </CardContent>
                </Card>
              </div>
              
              {/* Mobile buttons for visit/edit */}
              <div className="flex space-x-3 mb-6 md:hidden">
                <a 
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center flex-1 justify-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Visit Project
                </a>
                {isAuthor && (
                  <Link href={`/projects/${id}/edit`} className="flex-1">
                    <Button 
                      variant="secondary"
                      className="text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center w-full justify-center"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Project URL with copy button */}
              <div className="flex items-center mb-6 bg-gray-50 rounded-md border border-gray-200 p-2 overflow-hidden">
                <div className="text-xs text-gray-500 font-medium px-2">Project URL:</div>
                <div className="text-sm text-gray-700 truncate flex-1">{project.projectUrl}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-primary"
                  onClick={handleCopyProjectUrl}
                >
                  {projectUrlCopied ? (
                    <span className="text-green-600 text-xs">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          {/* About this project / Comments tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1">
                Comments 
                <span className="bg-gray-100 text-gray-800 rounded-full text-xs px-2 ml-1">
                  {project.commentsCount || 0}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="focus-visible:outline-none focus-visible:ring-0">
              {/* Image Gallery */}
              {galleryImages.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Gallery</h2>
                  <ImageGallery images={galleryImages} mainImageUrl={project.imageUrl} />
                </div>
              )}
              
              <div className="prose prose-sm max-w-none text-gray-700">
                <h2 className="text-xl font-bold text-foreground mb-4">About this project</h2>
                <p className="mb-4">{project.description}</p>
                
                {project.longDescription && (
                  <div className="mt-6" dangerouslySetInnerHTML={{ __html: project.longDescription }} />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="focus-visible:outline-none focus-visible:ring-0">
              <CommentSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
