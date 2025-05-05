import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/ShareButton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

const ProjectCard = ({ project, className }: ProjectCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(project.isLiked || false);
  const [likesCount, setLikesCount] = useState(project.likesCount || 0);
  const [sharesCount, setSharesCount] = useState(project.sharesCount || 0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${project.id}/like`, { liked: !liked });
      return !liked;
    },
    onSuccess: (newLikedState) => {
      setLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like project. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleLike = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      likeMutation.mutate();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo`;
  };

  return (
    <Card className={cn("bg-white rounded-lg overflow-hidden shadow-sm hover-card-animation h-full flex flex-col", className)}>
      <Link href={`/projects/${project.id}`} className="block relative pt-[56.25%] w-full overflow-hidden bg-gray-100">
        <img 
          className="absolute inset-0 h-full w-full object-cover object-top cursor-pointer transition-transform hover:scale-105 duration-300" 
          src={project.imageUrl} 
          alt={project.title}
          onError={(e) => {
            // Set a fallback image if the image fails to load
            e.currentTarget.src = '/ctrlaltvibelogo.png';
            e.currentTarget.classList.add('object-contain', 'p-4');
            e.currentTarget.classList.remove('object-cover', 'object-top');
          }}
        />
      </Link>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <Link 
              href={`/projects/${project.id}`} 
              className="text-lg font-bold text-foreground font-space hover:text-primary line-clamp-1 pr-2"
            >
              {project.title}
            </Link>
            <button
              className={cn(
                "text-gray-400 hover:text-secondary flex-shrink-0",
                liked && "text-secondary"
              )}
              onClick={toggleLike}
              disabled={likeMutation.isPending}
            >
              <Heart className={cn("h-5 w-5", liked && "fill-secondary")} />
            </button>
          </div>
          
          <p className="text-gray-500 text-xs mt-1">
            by {project.author && project.author.username ? (
              <Link href={`/?user=${project.author.username}`} className="text-primary hover:underline">
                {project.author.username}
              </Link>
            ) : (
              <span className="text-primary">Anonymous</span>
            )}
            <span className="mx-1">·</span>
            <span>{formatTimeAgo(project.createdAt)}</span>
          </p>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
        
        <div className="mt-auto">
          <div className="flex flex-wrap gap-1 mb-3 overflow-hidden">
            {project.tags && project.tags.length > 0 ? (
              project.tags.slice(0, 3).map((tag) => (
                <Link key={tag} href={`/?tag=${tag}`} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full truncate max-w-[100px] hover:bg-gray-200 transition-colors">
                  {tag}
                </Link>
              ))
            ) : (
              <span className="text-gray-400 text-xs">No tags</span>
            )}
            {project.tags && project.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{project.tags.length - 3}</span>
            )}
          </div>
        
          <div className="flex items-center space-x-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span className="flex items-center">
              <Heart className="h-3.5 w-3.5 mr-1 text-secondary" /> {likesCount}
            </span>
            <span className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> {project.commentsCount || 0}
            </span>
            <span className="flex items-center">
              <Share2 className="h-3.5 w-3.5 mr-1" /> {sharesCount}
            </span>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to like projects, comment, and interact with the community.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-3 mt-4">
            <p className="text-sm text-gray-600">Join Ctrl Alt Vibe to share your AI-assisted projects and engage with other developers.</p>
            
            <div className="flex justify-between mt-2">
              <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign in / Register
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectCard;
