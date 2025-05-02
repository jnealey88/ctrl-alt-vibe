import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
}

const TagSelector = ({
  value = [],
  onChange,
  maxTags = 5,
  className = "",
}: TagSelectorProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(value);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all available tags
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ["/api/tags"],
    queryFn: async () => {
      const response = await fetch("/api/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      return response.json();
    },
  });

  useEffect(() => {
    setSelectedTags(value);
  }, [value]);

  useEffect(() => {
    onChange(selectedTags);
  }, [selectedTags, onChange]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      const newTags = selectedTags.filter((t) => t !== tag);
      setSelectedTags(newTags);
    } else if (selectedTags.length < maxTags) {
      // Add tag if under max limit
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Filter tags based on search query
  const filteredTags = tagsData?.tags.filter((tag: string) =>
    tag.toLowerCase().includes(searchQuery)
  ) || [];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <p className="text-sm text-gray-500">No tags selected. Select up to {maxTags} tags below.</p>
        ) : (
          selectedTags.map((tag) => (
            <Badge key={tag} className="bg-primary text-white flex items-center gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="ml-1 rounded-full hover:bg-primary-dark p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tags..."
          className="w-full p-2 border rounded-md text-sm"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Tags list */}
      <ScrollArea className="h-48 border rounded-md p-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-20" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No tags found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTags.map((tag: string) => {
              const isSelected = selectedTags.includes(tag);
              const isDisabled = selectedTags.length >= maxTags && !isSelected;

              return (
                <div
                  key={tag}
                  onClick={() => !isDisabled && handleTagToggle(tag)}
                  className={`p-2 rounded-md flex items-center justify-between ${isSelected ? "bg-primary/10" : "hover:bg-gray-100"} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="text-sm">{tag}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-gray-500">
        {selectedTags.length}/{maxTags} tags selected
      </p>
    </div>
  );
};

export default TagSelector;
