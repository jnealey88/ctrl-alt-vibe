import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users as UsersIcon, X } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

type Profile = {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

type ProfilesResponse = {
  profiles: Profile[];
  pagination: {
    page: number;
    limit: number;
    totalProfiles: number;
    totalPages: number;
    hasMore: boolean;
  };
};

interface QueryParams {
  page?: number;
  role?: string;
  tag?: string;
  search?: string;
  sort?: string;
}

export default function UsersPage() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>("all_tools");
  const [selectedTag, setSelectedTag] = useState<string>("all_tags");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputSearch, setInputSearch] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("newest");

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const tagParam = params.get('tag');
    const searchParam = params.get('search');
    const sortParam = params.get('sort');
    const pageParam = params.get('page');

    if (roleParam) setSelectedRole(roleParam);
    else setSelectedRole('all_tools');
    
    if (tagParam) setSelectedTag(tagParam);
    else setSelectedTag('all_tags');
    if (searchParam) {
      setSearchQuery(searchParam);
      setInputSearch(searchParam);
    }
    if (sortParam) setSortOption(sortParam);
    if (pageParam) setCurrentPage(parseInt(pageParam, 10));
  }, [location]);

  // Fetch profiles based on filters
  const { data, isLoading } = useQuery<ProfilesResponse>({
    queryKey: [
      '/api/profiles', 
      currentPage, 
      selectedRole, 
      selectedTag,
      searchQuery, 
      sortOption
    ],
    queryFn: async () => {
      let url = `/api/profiles?page=${currentPage}`;
      if (selectedRole && selectedRole !== 'all_tools') url += `&role=${encodeURIComponent(selectedRole)}`;
      if (selectedTag && selectedTag !== 'all_tags') url += `&tag=${encodeURIComponent(selectedTag)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (sortOption) url += `&sort=${encodeURIComponent(sortOption)}`;
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch profiles");
      return response.json();
    },
  });

  // Fetch all available user roles/AI tools used
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery<{roles: string[]}>({ 
    queryKey: ['/api/user-roles'],
    queryFn: async () => {
      const response = await fetch('/api/user-roles');
      if (!response.ok) throw new Error("Failed to fetch user roles");
      return response.json();
    },
  });

  // Search now happens automatically with onChange event

  // Fetch popular tags for filtering
  const { data: tagsData, isLoading: isLoadingTags } = useQuery<{tags: string[]}>({ 
    queryKey: ['/api/tags/popular'],
    queryFn: async () => {
      const response = await fetch('/api/tags/popular');
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });

  const clearSearch = () => {
    setInputSearch('');
    setSearchQuery('');
    updateUrl(1, selectedRole, selectedTag, '', sortOption);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    updateUrl(1, role, selectedTag, searchQuery, sortOption);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    updateUrl(1, selectedRole, tag, searchQuery, sortOption);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    updateUrl(1, selectedRole, selectedTag, searchQuery, value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(page, selectedRole, selectedTag, searchQuery, sortOption);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUrl = (page: number, role: string, tag: string, search: string, sort: string) => {
    const params: QueryParams = {};
    if (page && page > 1) params.page = page;
    if (role && role !== 'all_tools') params.role = role;
    if (tag && tag !== 'all_tags') params.tag = tag;
    if (search) params.search = search;
    if (sort && sort !== 'newest') params.sort = sort;

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    setLocation(`/users${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="w-full md:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            
            {/* Search */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Search</h3>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={inputSearch}
                  onChange={(e) => {
                    setInputSearch(e.target.value);
                    if (e.target.value === "") {
                      clearSearch();
                    } else {
                      // Add debounce for typing
                      const timer = setTimeout(() => {
                        setSearchQuery(e.target.value);
                        updateUrl(1, selectedRole, selectedTag, e.target.value, sortOption);
                      }, 300);
                      return () => clearTimeout(timer);
                    }
                  }}
                  className="pl-8 pr-8"
                />
                {inputSearch && (
                  <button 
                    type="button" 
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Sort */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Sort By</h3>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="activity">Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Tools Used */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">AI Tools Used</h3>
              {isLoadingRoles ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select 
                  value={selectedRole} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select AI tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_tools">All Tools</SelectItem>
                    {rolesData?.roles && rolesData.roles.length > 0 ? (
                      rolesData.roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Project Tags */}
            <div>
              <h3 className="font-medium mb-2">Project Tags</h3>
              {isLoadingTags ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select 
                  value={selectedTag} 
                  onValueChange={handleTagChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by project tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_tags">All Tags</SelectItem>
                    {tagsData?.tags && tagsData.tags.length > 0 ? (
                      tagsData.tags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              {selectedRole !== 'all_tools' && selectedTag !== 'all_tags' ? `Members using "${selectedRole}" with "${selectedTag}" projects` :
               selectedRole !== 'all_tools' ? `Members using "${selectedRole}"` : 
               selectedTag !== 'all_tags' ? `Members with "${selectedTag}" projects` :
               searchQuery ? `Search results for "${searchQuery}"` : 
               sortOption === 'activity' ? 'Most Active Members' :
               sortOption === 'oldest' ? 'Founding Members' :
               'Community Members'}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : data?.profiles && data.profiles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.profiles.map((profile) => (
                  <Card key={profile.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <Avatar className="h-20 w-20 mt-2">
                          {profile.avatarUrl ? (
                            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                          ) : (
                            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                              {profile.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-medium mb-1">{profile.username}</h3>
                          {profile.bio && <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>}
                        </div>
                        <Button asChild variant="outline" className="w-full mt-2">
                          <Link href={`/profile/${profile.username}`}>View Profile</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    page={currentPage}
                    onPageChange={handlePageChange}
                    totalPages={data.pagination.totalPages}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
              <Button 
                onClick={() => {
                  setSelectedRole('all_tools');
                  setSelectedTag('all_tags');
                  setSearchQuery('');
                  setInputSearch('');
                  setSortOption('newest');
                  updateUrl(1, 'all_tools', 'all_tags', '', 'newest');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
