import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationBell() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    isCountLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  // Format the notification message based on type
  const getNotificationContent = (notification: any) => {
    const { type, actor, project } = notification;
    const actorName = actor?.username || 'Someone';

    switch (type) {
      case 'new_comment':
        return (
          <>
            <span className="font-medium">{actorName}</span> commented on your project
            {project ? (
              <> <span className="font-medium">"{project.title}"</span></>
            ) : (
              ''
            )}
          </>
        );
      case 'new_reply':
        return (
          <>
            <span className="font-medium">{actorName}</span> replied to your comment
          </>
        );
      case 'liked_project':
        return (
          <>
            <span className="font-medium">{actorName}</span> liked your project
            {project ? (
              <> <span className="font-medium">"{project.title}"</span></>
            ) : (
              ''
            )}
          </>
        );
      default:
        return (
          <>
            <span className="font-medium">{actorName}</span> interacted with your content
          </>
        );
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-3 lg:ml-4 relative hover:bg-gray-100 rounded-full w-9 h-9 p-0"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {!isCountLoading && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 hover:bg-gray-100"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="px-4 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 mb-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
            </div>
          ) : (
            // List of notifications
            <div>
              {notifications.map((notification: any) => (
                <Link
                  key={notification.id}
                  href={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`flex items-start space-x-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={notification.actor?.avatarUrl || ''}
                        alt={notification.actor?.username || 'User'}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {notification.actor?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm">{getNotificationContent(notification)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-3 w-3 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to get the link for a notification
function getNotificationLink(notification: any) {
  const { type, project, comment } = notification;

  if (type === 'new_comment' || type === 'new_reply' || type === 'liked_project') {
    if (project?.id) {
      return `/projects/${project.id}`;
    }
  }

  return '/';
}
