import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  Reply, 
  Image, 
  AtSign, 
  Code, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  ThumbsUp, 
  RefreshCw,
  Copy 
} from "lucide-react";
import type { Comment, CommentReply } from "@shared/schema";

interface CommentSectionProps {
  projectId: number;
}

const CommentSection = ({ projectId }: CommentSectionProps) => {
  // Use the provided projectId instead of getting it from useParams
  // const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostLiked">("newest");
  const [page, setPage] = useState(1);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Function to focus the comment input
  const focusCommentInput = useCallback(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);
  
  type CommentsResponse = {
    comments: Comment[];
    hasMore: boolean;
    totalComments: number;
  };

  const { data, isLoading } = useQuery<CommentsResponse>({
    queryKey: [`/api/projects/${projectId}/comments`, { sortBy, page }],
  });

  const comments = data?.comments || [];
  const hasMore = data?.hasMore || false;
  
  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/comments`, { content: commentText });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/comments`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/comments`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      await apiRequest("DELETE", `/api/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/comments`] });
      toast({
        title: "Reply deleted",
        description: "Your reply has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reply. Please try again.",
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
  
  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };
  
  const handleDeleteReply = (replyId: number) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      deleteReplyMutation.mutate(replyId);
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
    <div key={comment.id} className="pt-4 first:pt-0 border-t first:border-t-0 border-gray-100">
      <div className="flex gap-3">
        <Link href={`/profile/${comment.author.username}`} className="shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {comment.author.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Link 
                href={`/profile/${comment.author.username}`}
                className="text-sm font-medium text-gray-900 hover:text-primary hover:underline transition-colors"
              >
                {comment.author.username}
              </Link>
              {comment.isAuthor && (
                <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/10 text-xs py-0 px-2">
                  Creator
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
          </div>
          
          {/* Comment content */}
          <div className="mb-3 text-sm text-gray-700 break-words">
            <p className="whitespace-pre-line">{comment.content}</p>
          </div>
          
          {/* Comment actions */}
          <div className="flex items-center gap-4 text-xs">
            <button 
              className="text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
              onClick={() => setReplyingTo(comment.id === replyingTo ? null : comment.id)}
              disabled={!user}
            >
              <Reply className="h-3.5 w-3.5" /> Reply
            </button>
            <button 
              className={`flex items-center gap-1 transition-colors ${comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              onClick={() => handleLikeComment(comment.id, false, comment.isLiked || false)}
              disabled={!user}
            >
              <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-red-500' : ''}`} /> 
              <span>{comment.likesCount || 0}</span>
            </button>
            {/* Show delete button only for the comment author */}
            {user?.id === comment.author.id && (
              <button 
                className="text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                onClick={() => handleDeleteComment(comment.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-4 pl-3 border-l-2 border-gray-200">
              <form onSubmit={handleSubmitReply}>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[80px] border-gray-200 focus:border-primary"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={replyMutation.isPending || !replyText.trim()}
                    className="gap-1"
                  >
                    {replyMutation.isPending ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Reply className="h-3.5 w-3.5" />
                    )}
                    Post Reply
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-3 border-l-2 border-gray-200">
              {comment.replies.map((reply: CommentReply) => (
                <div key={reply.id} className="flex gap-3">
                  <Link href={`/profile/${reply.author.username}`} className="shrink-0">
                    <Avatar className="h-8 w-8 ring-2 ring-white">
                      <AvatarImage src={reply.author.avatarUrl} alt={reply.author.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {reply.author.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    {/* Reply header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/profile/${reply.author.username}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary hover:underline transition-colors"
                        >
                          {reply.author.username}
                        </Link>
                        {reply.isAuthor && (
                          <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/10 text-xs py-0 px-2">
                            Creator
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Reply content */}
                    <div className="mb-2 text-sm text-gray-700 break-words">
                      <p className="whitespace-pre-line">{reply.content}</p>
                    </div>
                    
                    {/* Reply actions */}
                    <div className="flex items-center gap-4 text-xs">
                      <button 
                        className={`flex items-center gap-1 transition-colors ${reply.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        onClick={() => handleLikeComment(reply.id, true, reply.isLiked || false)}
                        disabled={!user}
                      >
                        <Heart className={`h-3.5 w-3.5 ${reply.isLiked ? 'fill-red-500' : ''}`} /> 
                        <span>{reply.likesCount || 0}</span>
                      </button>
                      {/* Show delete button only for the reply author */}
                      {user?.id === reply.author.id && (
                        <button 
                          className="text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                          onClick={() => handleDeleteReply(reply.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-4 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Comments 
            <Badge variant="outline" className="ml-2 bg-primary/5 hover:bg-primary/10 text-primary">
              {data?.totalComments || 0}
            </Badge>
          </h2>
        </div>
        
        <div className="flex gap-2 bg-gray-50 rounded-md p-1">
          <Button 
            size="sm"
            variant={sortBy === "newest" ? "default" : "ghost"}
            className={`text-xs px-3 ${sortBy === "newest" ? "bg-primary text-white" : "text-gray-600"}`}
            onClick={() => handleSortChange("newest")}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Newest
          </Button>
          <Button 
            size="sm"
            variant={sortBy === "oldest" ? "default" : "ghost"}
            className={`text-xs px-3 ${sortBy === "oldest" ? "bg-primary text-white" : "text-gray-600"}`}
            onClick={() => handleSortChange("oldest")}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Oldest
          </Button>
          <Button 
            size="sm"
            variant={sortBy === "mostLiked" ? "default" : "ghost"}
            className={`text-xs px-3 ${sortBy === "mostLiked" ? "bg-primary text-white" : "text-gray-600"}`}
            onClick={() => handleSortChange("mostLiked")}
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            Most Liked
          </Button>
        </div>
      </div>
      
      {/* Comment form */}
      <Card className="mb-8 shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-4">
          <form onSubmit={handleSubmitComment}>
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 mt-1 border">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white shadow-sm">
                  <Textarea
                    ref={commentInputRef}
                    id="comment"
                    rows={3}
                    className="block w-full resize-none border-0 focus:ring-0 sm:text-sm"
                    placeholder={user ? "Share your thoughts on this project..." : "Sign in to comment"}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!user}
                  />
                  <div className="border-t border-gray-200 py-2 px-3 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Add image"
                      >
                        <Image className="h-5 w-5" />
                      </button>
                      <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Mention user"
                      >
                        <AtSign className="h-5 w-5" />
                      </button>
                      <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Add code snippet"
                      >
                        <Code className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {!user ? (
                      <Link href="/login" className="text-primary hover:underline text-sm">
                        Sign in to comment
                      </Link>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={commentMutation.isPending || !commentText.trim()}
                        size="sm"
                        className="gap-1 px-4"
                      >
                        {commentMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        Post Comment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <p className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading comments...
          </p>
        </div>
      ) : comments.length === 0 ? (
        <Alert className="bg-gray-50 border-gray-200">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <AlertDescription className="text-gray-600">
            No comments yet. Be the first to comment!
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="space-y-6 bg-white px-5 py-4 rounded-lg border shadow-sm">
            {comments.map(renderCommentWithReplies)}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                size="sm"
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" /> Load More Comments
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;