import { useState } from "react";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Reply, Image, AtSign, Code } from "lucide-react";
import type { Comment, CommentReply } from "@shared/schema";

const CommentSection = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostLiked">("newest");
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}/comments`, { sortBy, page }],
  });

  const comments: Comment[] = data?.comments || [];
  const hasMore = data?.hasMore || false;
  
  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${id}/comments`, { content: commentText });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/comments/${replyingTo}/replies`, { content: replyText });
    },
    onSuccess: () => {
      setReplyText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/comments`] });
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, isReply, liked }: { commentId: number; isReply: boolean; liked: boolean }) => {
      const endpoint = isReply 
        ? `/api/replies/${commentId}/like` 
        : `/api/comments/${commentId}/like`;
      await apiRequest("POST", endpoint, { liked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/comments`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLikeComment = (commentId: number, isReply: boolean, currentlyLiked: boolean) => {
    likeMutation.mutate({ commentId, isReply, liked: !currentlyLiked });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate();
    }
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && replyingTo) {
      replyMutation.mutate();
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

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSortChange = (newSortBy: "newest" | "oldest" | "mostLiked") => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const renderCommentWithReplies = (comment: Comment) => (
    <div key={comment.id} className="flex space-x-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.username} />
        <AvatarFallback>{comment.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {comment.author.username}
            {comment.isAuthor && (
              <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded ml-2">Creator</span>
            )}
          </h3>
          <p className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</p>
        </div>
        <div className="mt-1 text-sm text-gray-700">
          <p>{comment.content}</p>
        </div>
        <div className="mt-2 flex items-center space-x-4 text-sm">
          <button 
            className="text-gray-500 hover:text-primary flex items-center"
            onClick={() => setReplyingTo(comment.id === replyingTo ? null : comment.id)}
          >
            <Reply className="h-4 w-4 mr-1" /> Reply
          </button>
          <button 
            className={`text-gray-500 hover:text-secondary flex items-center ${comment.isLiked ? 'text-secondary' : ''}`}
            onClick={() => handleLikeComment(comment.id, false, comment.isLiked || false)}
          >
            <Heart className={`h-4 w-4 mr-1 ${comment.isLiked ? 'fill-secondary' : ''}`} /> {comment.likesCount || 0}
          </button>
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-4 ml-6">
            <form onSubmit={handleSubmitReply}>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px]"
              />
              <div className="mt-2 flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  Post Reply
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply: CommentReply) => (
              <div key={reply.id} className="ml-6 flex space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.author.avatarUrl} alt={reply.author.username} />
                  <AvatarFallback>{reply.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">
                      {reply.author.username}
                      {reply.isAuthor && (
                        <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded ml-2">Creator</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}</p>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>{reply.content}</p>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <button 
                      className={`text-gray-500 hover:text-secondary flex items-center ${reply.isLiked ? 'text-secondary' : ''}`}
                      onClick={() => handleLikeComment(reply.id, true, reply.isLiked || false)}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${reply.isLiked ? 'fill-secondary' : ''}`} /> {reply.likesCount || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="border-t border-gray-200 pt-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground font-space">
          Comments ({data?.totalComments || 0})
        </h2>
        <div className="flex space-x-2 text-sm">
          <button 
            className={`text-gray-500 hover:text-primary flex items-center ${sortBy === "newest" ? "text-primary" : ""}`}
            onClick={() => handleSortChange("newest")}
          >
            Newest
          </button>
          <button 
            className={`text-gray-500 hover:text-primary flex items-center ${sortBy === "oldest" ? "text-primary" : ""}`}
            onClick={() => handleSortChange("oldest")}
          >
            Oldest
          </button>
          <button 
            className={`text-gray-500 hover:text-primary flex items-center ${sortBy === "mostLiked" ? "text-primary" : ""}`}
            onClick={() => handleSortChange("mostLiked")}
          >
            Most Liked
          </button>
        </div>
      </div>
      
      {/* Comment form */}
      <div className="mb-8">
        <form onSubmit={handleSubmitComment}>
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Textarea
                  id="comment"
                  rows={3}
                  className="block w-full resize-none border-0 focus:ring-0 sm:text-sm"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="border-t border-gray-300 py-2 px-3 flex justify-between items-center">
                  <div className="flex items-center space-x-5">
                    <button type="button" className="text-gray-500 hover:text-gray-700">
                      <Image className="h-5 w-5" />
                    </button>
                    <button type="button" className="text-gray-500 hover:text-gray-700">
                      <AtSign className="h-5 w-5" />
                    </button>
                    <button type="button" className="text-gray-500 hover:text-gray-700">
                      <Code className="h-5 w-5" />
                    </button>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={commentMutation.isPending || !commentText.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <p>Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {comments.map(renderCommentWithReplies)}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
              >
                Load More Comments
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;
