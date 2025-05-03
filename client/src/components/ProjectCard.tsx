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
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  return (
    <Card className={cn("bg-white rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px]", className)}>
      <Link href={`/projects/${project.id}`}>
          <img 
            className="h-48 w-full object-cover cursor-pointer" 
            src={project.imageUrl} 
            alt={project.title} 
          />
      </Link>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/projects/${project.id}`} className="text-lg font-bold text-foreground font-space hover:text-primary">
              {project.title}
            </Link>
            <p className="text-gray-500 text-sm mb-2">
              by {project.author && project.author.username ? (
                <Link href={`/?user=${project.author.username}`} className="text-primary hover:underline">
                  {project.author.username}
                </Link>
              ) : (
                <span className="text-primary">Anonymous</span>
              )}
            </p>
          </div>
          <button
            className={cn(
              "text-gray-400 hover:text-secondary",
              liked && "text-secondary"
            )}
            onClick={toggleLike}
            disabled={likeMutation.isPending}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-secondary")} />
          </button>
        </div>
        <p className="text-gray-600 text-sm mb-4">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags && project.tags.length > 0 ? (
            project.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${tag}`} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                {tag}
              </Link>
            ))
          ) : (
            <span className="text-gray-400 text-xs">No tags</span>
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          <ShareButton
            projectId={project.id}
            projectTitle={project.title}
            projectUrl={`/projects/${project.id}`}
            onShare={(newSharesCount) => setSharesCount(newSharesCount)}
          />
          <span className="text-sm text-gray-500">{formatTimeAgo(project.createdAt)}</span>
        </div>
        
        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center">
            <Heart className="h-4 w-4 mr-1 text-secondary" /> {likesCount}
          </span>
          <span className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" /> {project.commentsCount || 0}
          </span>
          <span className="flex items-center">
            <Share2 className="h-4 w-4 mr-1" /> {sharesCount}
          </span>
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
