import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProjectCard from '@/components/ProjectCard';
import { Loader2, Search, X } from 'lucide-react';

interface QueryParams {
  page?: number;
  tag?: string;
  search?: string;
  sort?: string;
}

const BrowseProjects = () => {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputSearch, setInputSearch] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('trending');

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag');
    const searchParam = params.get('search');
    const sortParam = params.get('sort');
    const pageParam = params.get('page');

    if (tagParam) setSelectedTag(tagParam);
    if (searchParam) {
      setSearchQuery(searchParam);
      setInputSearch(searchParam);
    }
    if (sortParam) setSortOption(sortParam);
    if (pageParam) setCurrentPage(parseInt(pageParam, 10));
  }, [location]);

  // Fetch projects based on filters
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{ 
    projects: Project[]; 
    hasMore: boolean; 
    total: number
  }>({
    queryKey: [
      '/api/projects', 
      currentPage, 
      selectedTag, 
      searchQuery, 
      sortOption
    ],
    queryFn: async () => {
      let url = `/api/projects?page=${currentPage}`;
      if (selectedTag) url += `&tag=${encodeURIComponent(selectedTag)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (sortOption) url += `&sort=${encodeURIComponent(sortOption)}`;
      
      const response = await fetch(url);
      return response.json();
    },
  });

  // Fetch all available tags
  const { data: tagsData, isLoading: isLoadingTags } = useQuery<{tags: string[]}>({ 
    queryKey: ['/api/tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputSearch);
    updateUrl(1, selectedTag, inputSearch, sortOption);
  };

  const clearSearch = () => {
    setInputSearch('');
    setSearchQuery('');
    updateUrl(1, selectedTag, '', sortOption);
  };

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    updateUrl(1, newTag, searchQuery, sortOption);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    updateUrl(1, selectedTag, searchQuery, value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(page, selectedTag, searchQuery, sortOption);
  };

  const updateUrl = (page: number, tag: string, search: string, sort: string) => {
    const params: QueryParams = {};
    if (page && page > 1) params.page = page;
    if (tag) params.tag = tag;
    if (search) params.search = search;
    if (sort && sort !== 'trending') params.sort = sort;

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    setLocation(`/browse${queryString ? `?${queryString}` : ''}`);
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
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Search projects..."
                    value={inputSearch}
                    onChange={(e) => setInputSearch(e.target.value)}
                    className="pr-8"
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
                <Button type="submit" size="sm">
                  <Search size={16} className="mr-1" />
                  Search
                </Button>
              </form>
            </div>
            
            {/* Sort */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Sort By</h3>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Viewed</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-medium mb-2">Tags</h3>
              {isLoadingTags ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagsData?.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              {selectedTag ? `Projects tagged with "${selectedTag}"` : 
               searchQuery ? `Search results for "${searchQuery}"` : 
               sortOption === 'featured' ? 'Featured Projects' :
               sortOption === 'latest' ? 'Latest Projects' :
               sortOption === 'popular' ? 'Popular Projects' :
               'Trending Projects'}
            </h1>
          </div>

          {isLoadingProjects ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : projectsData?.projects && projectsData.projects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {projectsData.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              
              {/* Pagination */}
              {projectsData && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!projectsData.hasMore}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
              <Button 
                onClick={() => {
                  setSelectedTag('');
                  setSearchQuery('');
                  setInputSearch('');
                  setSortOption('trending');
                  updateUrl(1, '', '', 'trending');
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
};

export default BrowseProjects;