import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ExternalLink, 
  Heart, 
  Share2, 
  Bookmark,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import CommentSection from "@/components/CommentSection";
import SEO from "@/components/SEO";
import type { Project } from "@shared/schema";

const ProjectDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery<{project: Project}>({
    queryKey: [`/api/projects/${id}`],
  });
  
  const project: Project | undefined = data?.project;
  
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
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16">
        <div className="relative">
          <img 
            className="w-full h-80 object-cover" 
            src={project.imageUrl} 
            alt={project.title} 
          />
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="bg-white/90 hover:bg-white rounded-full text-gray-700 h-10 w-10"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className={`bg-white/90 hover:bg-white rounded-full h-10 w-10 ${project.isLiked ? 'text-secondary' : 'text-gray-700'}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${project.isLiked ? 'fill-secondary' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-space mb-2">{project.title}</h1>
              <p className="text-gray-500 mb-4">
                Submitted by <Link href={`/?user=${project.author.username}`}><a className="text-primary hover:underline">{project.author.username}</a></Link> on {formatDate(project.createdAt)}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map(tag => (
                  <Link key={tag} href={`/?tag=${tag}`}>
                    <a className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                      {tag}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <a 
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Visit Project
              </a>
              {isAuthor && (
                <Link href={`/projects/${id}/edit`}>
                  <Button 
                    variant="secondary"
                    className="text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
              >
                <Bookmark className={`h-4 w-4 ${project.isBookmarked ? 'fill-gray-700' : ''}`} />
              </Button>
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground font-space mb-4">About this project</h2>
            
            {project.vibeCodingTool && (
              <div className="mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full border border-purple-400">
                  <span className="font-bold">AI Tool:</span> {project.vibeCodingTool}
                </span>
              </div>
            )}
            
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="mb-4">{project.description}</p>
              
              {project.longDescription && (
                <div dangerouslySetInnerHTML={{ __html: project.longDescription }} />
              )}
            </div>
          </div>
          
          <CommentSection />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
