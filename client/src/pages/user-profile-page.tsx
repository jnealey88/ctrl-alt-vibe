import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Loader2, Mail, Heart, Eye, Grid, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import ProjectCard from "@/components/ProjectCard";
import { ShareButton } from "@/components/ShareButton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfileResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  projects: Project[];
};

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username;

  const { data: profileData, isLoading, error } = useQuery<UserProfileResponse>({
    queryKey: ["/api/profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${username}`);
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container mx-auto py-10 flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto py-6 sm:py-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Profile Hero Section - Behance Inspired */}
      <div className="relative mb-6 sm:mb-10">
        {/* Cover Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 h-64 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        
        <div className="container mx-auto relative">
          {/* Profile Info Section */}
          <div className="pt-10 sm:pt-16 pb-12 sm:pb-20 md:flex items-end gap-8">
            {/* Avatar */}
            <div className="relative z-10 mb-4 md:mb-0 mx-auto md:mx-0 w-fit">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg">
                {profileData.user.avatarUrl ? (
                  <AvatarImage src={profileData.user.avatarUrl} alt={profileData.user.username} />
                ) : (
                  <AvatarFallback className="text-3xl sm:text-4xl font-bold uppercase bg-primary/20 text-primary">
                    {profileData.user.username.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{profileData.user.username}</h1>
                  <div className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Mail className="h-4 w-4" />
                    {profileData.user.email}
                  </div>
                  {profileData.user.bio && (
                    <p className="max-w-2xl mx-auto md:mx-0 text-sm md:text-base leading-relaxed">{profileData.user.bio}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
                  <ShareButton
                    title={profileData.user.username}
                    url={`/profile/${profileData.user.username}`}
                    contentType="profile"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Projects</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">{profileData.projects.length || 0}</h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Grid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Total Likes</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">
                    {profileData.projects.reduce((total, project) => total + (project.likesCount || 0), 0) || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Total Views</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">
                    {profileData.projects.reduce((total, project) => total + (project.viewsCount || 0), 0) || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <h2 className="text-2xl font-bold mb-6">Projects</h2>
        <div className="mt-6">
          {profileData.projects && profileData.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileData.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-muted">
              <div className="mb-4 mx-auto h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                This user hasn't submitted any projects yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
