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
  projectId?: number; // Optional for sharing profiles
  title?: string;
  url?: string;
  projectTitle?: string; // For backward compatibility
  projectUrl?: string; // For backward compatibility
  contentType?: 'project' | 'profile' | 'blog';
  onShare?: (sharesCount: number) => void;
  className?: string;
  buttonLabel?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function ShareButton({ 
  projectId, 
  title,
  url,
  projectTitle, // For backward compatibility
  projectUrl, // For backward compatibility 
  contentType = 'project',
  onShare, 
  className = '',
  buttonLabel = 'Share',
  iconOnly = false,
  variant = 'outline',
  size = 'sm'
}: ShareButtonProps) {
  // Handle backward compatibility
  const finalTitle = title || projectTitle || 'Content';
  const finalUrl = url || projectUrl || '';
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);
  
  // Make sure we have an absolute URL
  const fullUrl = finalUrl.startsWith('http') ? finalUrl : `${window.location.origin}${finalUrl}`;
  
  // Title for social media shares
  const getShareTitle = () => {
    switch(contentType) {
      case 'profile':
        return `Check out ${finalTitle}'s profile on Ctrl Alt Vibe`;
      case 'blog':
        return `"${finalTitle}" on Ctrl Alt Vibe Blog`;
      case 'project':
      default:
        return `Check out "${finalTitle}" on Ctrl Alt Vibe`;
    }
  };
  
  // Description for social media shares
  const getShareDescription = () => {
    switch(contentType) {
      case 'profile':
        return `Check out this developer's profile and projects on Ctrl Alt Vibe!`;
      case 'blog':
        return `I found this interesting article on Ctrl Alt Vibe!`;
      case 'project':
      default:
        return `I found this amazing AI-assisted project on Ctrl Alt Vibe!`;
    }
  };
  
  const shareTitle = getShareTitle();
  const shareDescription = getShareDescription();
  
  // Content title based on type
  const getContentTitle = () => {
    switch(contentType) {
      case 'profile':
        return 'profile';
      case 'blog':
        return 'article';
      case 'project':
      default:
        return 'project';
    }
  };
  
  // Handle copying link to clipboard
  const handleCopyLink = async () => {
    try {
      setIsSharing(true);
      
      if (!fullUrl) {
        throw new Error('URL not available');
      }
      
      await navigator.clipboard.writeText(fullUrl);
      
      // Record the share if user is logged in and it's a project
      if (user && projectId && contentType === 'project') {
        const response = await apiRequest('POST', `/api/projects/${projectId}/share`, {
          platform: 'copy_link'
        });
        
        const data = await response.json();
        
        if (onShare && data.sharesCount) {
          onShare(data.sharesCount);
        }
      } else if (!user && contentType === 'project' && projectId) {
        // Just show success even if we couldn't track it
        setSharesCount(prev => prev + 1);
        if (onShare) {
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
  
  // Track social sharing events
  const trackSocialShare = async (platform: string) => {
    try {
      setIsSharing(true);
      
      // Only track project shares
      if (user && projectId && contentType === 'project') {
        const response = await apiRequest('POST', `/api/projects/${projectId}/share`, {
          platform
        });
        
        const data = await response.json();
        
        if (onShare && data.sharesCount) {
          onShare(data.sharesCount);
        }
      } else if (!user && contentType === 'project' && projectId) {
        // Just show success even if we couldn't track it
        setSharesCount(prev => prev + 1);
        if (onShare) {
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
            variant={variant} 
            size={size}
            className={`flex items-center ${iconOnly ? '' : 'space-x-1'} ${className}`}
          >
            <Share className="h-4 w-4" />
            {!iconOnly && <span>{buttonLabel}</span>}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this {getContentTitle()}</DialogTitle>
            <DialogDescription>
              Share with your friends and colleagues.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4">
            <TwitterShareButton 
              url={fullUrl} 
              title={shareTitle} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('twitter')}
            >
              <TwitterIcon size={40} round />
              <span className="mt-1 text-xs">Twitter</span>
            </TwitterShareButton>
            
            <FacebookShareButton 
              url={fullUrl} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('facebook')}
            >
              <FacebookIcon size={40} round />
              <span className="mt-1 text-xs">Facebook</span>
            </FacebookShareButton>
            
            <LinkedinShareButton 
              url={fullUrl} 
              title={shareTitle} 
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('linkedin')}
            >
              <LinkedinIcon size={40} round />
              <span className="mt-1 text-xs">LinkedIn</span>
            </LinkedinShareButton>
            
            <TelegramShareButton 
              url={fullUrl} 
              title={shareTitle}
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('telegram')}
            >
              <TelegramIcon size={40} round />
              <span className="mt-1 text-xs">Telegram</span>
            </TelegramShareButton>
            
            <WhatsappShareButton 
              url={fullUrl} 
              title={shareTitle}
              className="flex flex-col items-center justify-center"
              onClick={() => trackSocialShare('whatsapp')}
            >
              <WhatsappIcon size={40} round />
              <span className="mt-1 text-xs">WhatsApp</span>
            </WhatsappShareButton>
            
            <RedditShareButton 
              url={fullUrl} 
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
              {fullUrl || 'URL not available'}
            </div>
            <Button 
              onClick={handleCopyLink} 
              disabled={isSharing || !fullUrl}
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
