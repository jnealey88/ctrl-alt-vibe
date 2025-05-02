import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, Heart, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

interface FeaturedProjectProps {
  project: Project;
}

const FeaturedProject = ({ project }: FeaturedProjectProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(project.isLiked || false);
  const [likesCount, setLikesCount] = useState(project.likesCount || 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric' 
    }).format(date);
  };

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
    likeMutation.mutate();
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-card lg:flex">
      <div className="lg:w-1/2">
        <img 
          className="h-72 w-full object-cover lg:h-full" 
          src={project.imageUrl} 
          alt={project.title} 
        />
      </div>
      <div className="p-8 lg:w-1/2">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary">
              Project of the Week
            </span>
            <h3 className="mt-3 text-2xl font-bold text-foreground font-space">{project.title}</h3>
            <p className="text-gray-500 text-sm mb-4">
              by <Link href={`/?user=${project.author.username}`}><a className="text-primary hover:underline">{project.author.username}</a></Link> • {formatDate(project.createdAt)}
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
        <p className="text-gray-600 mb-6">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag) => (
            <Link key={tag} href={`/?tag=${tag}`}>
              <a className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                {tag}
              </a>
            </Link>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Heart className="h-4 w-4 mr-1 text-secondary" /> {likesCount}
            </span>
            <span className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" /> {project.commentsCount || 0}
            </span>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-1" /> {project.viewsCount || 0}
            </span>
          </div>
        </div>
        <div className="flex space-x-4">
          <a 
            href={project.projectUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            Visit Project
          </a>
          <Link href={`/projects/${project.id}`}>
            <a className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
              Read More
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProject;
