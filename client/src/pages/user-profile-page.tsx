import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Loader2, Heart, Eye, Grid, Image } from "lucide-react";
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
    bio?: string;
    avatarUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    websiteUrl?: string;
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
        
        <div className="container mx-auto relative px-4 sm:px-6">
          {/* Profile Info Section */}
          <div className="pt-10 sm:pt-16 pb-12 sm:pb-20 md:flex items-end gap-8">
            {/* Avatar */}
            <div className="relative z-10 mb-4 md:mb-0 mx-auto md:ml-2 md:mx-0 w-fit">
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

                  {profileData.user.bio && (
                    <p className="max-w-2xl mx-auto md:mx-0 text-sm md:text-base leading-relaxed">{profileData.user.bio}</p>
                  )}
                  
                  {/* Social Links */}
                  {(profileData.user.twitterUrl || profileData.user.githubUrl || profileData.user.linkedinUrl || profileData.user.websiteUrl) && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      {profileData.user.twitterUrl && (
                        <a href={profileData.user.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                          </svg>
                        </a>
                      )}
                      {profileData.user.githubUrl && (
                        <a href={profileData.user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                          </svg>
                        </a>
                      )}
                      {profileData.user.linkedinUrl && (
                        <a href={profileData.user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {profileData.user.websiteUrl && (
                        <a href={profileData.user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
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

      <div className="container mx-auto px-4 sm:px-6">
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
