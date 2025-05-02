import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users as UsersIcon } from "lucide-react";
import { Link } from "wouter";
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

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery<ProfilesResponse>({
    queryKey: ["/api/profiles", { page, search: debouncedSearch }],
    queryFn: async ({ queryKey }) => {
      const [_endpoint, params] = queryKey;
      const { page, search } = params as { page: number; search: string };
      
      const url = new URL("/api/profiles", window.location.origin);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return res.json();
    },
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Community Members</h1>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data?.profiles && data.profiles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                page={page}
                onPageChange={handlePageChange}
                totalPages={data.pagination.totalPages}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/40">
          <h3 className="text-xl font-medium mb-2">No users found</h3>
          {debouncedSearch ? (
            <p className="text-muted-foreground">
              No users matching &quot;{debouncedSearch}&quot; were found.
            </p>
          ) : (
            <p className="text-muted-foreground">
              There are no registered users in the system yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
