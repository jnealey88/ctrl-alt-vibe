import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Share2 as Share } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  TwitterShareButton, 
  FacebookShareButton, 
  LinkedinShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  RedditShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon,
  RedditIcon
} from 'react-share';

type ShareButtonProps = {
  projectId: number;
  projectTitle: string;
  projectUrl: string;
  onShare?: (sharesCount: number) => void;
  className?: string;
};

export function ShareButton({ projectId, projectTitle, projectUrl, onShare, className = '' }: ShareButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [sharesCount, setSharesCount] = useState(0); // Local temporary count for non-authenticated users
  
  // Make sure we have an absolute URL
  const fullProjectUrl = projectUrl.startsWith('http') ? projectUrl : window.location.origin + projectUrl;
  
  // Generate a URL to the project detail page
  const projectDetailUrl = `${window.location.origin}/projects/${projectId}`;
  
  // Share text for social platforms
  const shareTitle = `Check out "${projectTitle}" on Ctrl Alt Vibe`;
  const shareDescription = `I found this amazing AI-assisted project on Ctrl Alt Vibe! Check it out: ${projectTitle}`;
  
  const handleCopyLink = async () => {
    try {
      setIsSharing(true);
      await navigator.clipboard.writeText(projectDetailUrl);
      
      // Record the share if user is logged in
      if (user) {
        const response = await apiRequest('POST', `/api/projects/${projectId}/share`, {
          platform: 'copy_link'
        });
        
        const data = await response.json();
        
        if (onShare && data.sharesCount) {
          onShare(data.sharesCount);
        }
      } else {
        // Just show success even if we couldn't track it
        setSharesCount(prev => prev + 1);
        if (onShare) {
          // This ensures UI updates even if we can't track properly
          onShare(sharesCount + 1);
        }
        setShowAuthDialog(true);
      }
      
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard',
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to copy link',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  const trackSocialShare = async (platform: string) => {
    try {
      setIsSharing(true);
      
      // Record the share if user is logged in
      if (user) {
        const response = await apiRequest('POST', `/api/projects/${projectId}/share`, {
          platform
        });
        
        const data = await response.json();
        
        if (onShare && data.sharesCount) {
          onShare(data.sharesCount);
        }
      } else {
        // Just show success even if we couldn't track it
        setSharesCount(prev => prev + 1);
        if (onShare) {
          // This ensures UI updates even if we can't track properly
          onShare(sharesCount + 1);
        }
        // Show the auth dialog after they've shared (allowing the share to go through)
        setTimeout(() => setShowAuthDialog(true), 1000);
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    } finally {
      setIsSharing(false);
    }
  };
  
  // Component rendering
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`flex items-center space-x-1 ${className}`}
          >
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this project</DialogTitle>
            <DialogDescription>
              Share this amazing project with your friends and colleagues.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4">
            <TwitterShareButton 
              url={projectDetailUrl} 
              title={shareTitle} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('twitter')}
            >
              <TwitterIcon size={40} round />
              <span className="mt-1 text-xs">Twitter</span>
            </TwitterShareButton>
            
            <FacebookShareButton 
              url={projectDetailUrl} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('facebook')}
            >
              <FacebookIcon size={40} round />
              <span className="mt-1 text-xs">Facebook</span>
            </FacebookShareButton>
            
            <LinkedinShareButton 
              url={projectDetailUrl} 
              title={shareTitle} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('linkedin')}
            >
              <LinkedinIcon size={40} round />
              <span className="mt-1 text-xs">LinkedIn</span>
            </LinkedinShareButton>
            
            <TelegramShareButton 
              url={projectDetailUrl} 
              title={shareTitle}
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('telegram')}
            >
              <TelegramIcon size={40} round />
              <span className="mt-1 text-xs">Telegram</span>
            </TelegramShareButton>
            
            <WhatsappShareButton 
              url={projectDetailUrl} 
              title={shareTitle}
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('whatsapp')}
            >
              <WhatsappIcon size={40} round />
              <span className="mt-1 text-xs">WhatsApp</span>
            </WhatsappShareButton>
            
            <RedditShareButton 
              url={projectDetailUrl} 
              title={shareTitle}
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('reddit')}
            >
              <RedditIcon size={40} round />
              <span className="mt-1 text-xs">Reddit</span>
            </RedditShareButton>
          </div>
          
          <div className="flex justify-between space-x-4 items-center">
            <div className="w-full px-3 py-2 border rounded-md text-sm truncate">
              {projectDetailUrl}
            </div>
            <Button 
              onClick={handleCopyLink} 
              disabled={isSharing}
            >
              Copy Link
            </Button>
          </div>
          
          <DialogClose asChild>
            <Button variant="ghost" className="mt-2">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to track shares and interact with the community.
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
    </>
  );
}
