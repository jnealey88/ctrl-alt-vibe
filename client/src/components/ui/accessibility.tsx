import React from 'react';

/**
 * This component injects accessibility features at the application root level.
 * It includes announcements to screen readers for global application state changes.
 */
export function AccessibilityAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('');
  const announcementRef = React.useRef<HTMLDivElement>(null);

  // Sets up a global event listener for accessibility announcements
  React.useEffect(() => {
    const handler = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.message === 'string') {
        setAnnouncement(event.detail.message);
      }
    };

    // Add global event listener
    window.addEventListener('announce' as any, handler as EventListener);

    return () => {
      window.removeEventListener('announce' as any, handler as EventListener);
    };
  }, []);

  // When announcement changes, ensure screen readers announce it
  React.useEffect(() => {
    if (announcement && announcementRef.current) {
      // Clear after announcing to allow repeated announcements of the same text
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [announcement]);

  // Global function to trigger announcements from anywhere in the app
  if (typeof window !== 'undefined' && !window.announce) {
    window.announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      // Dispatch event to be caught by our listener
      window.dispatchEvent(
        new CustomEvent('announce', {
          detail: {
            message,
            priority
          }
        })
      );
    };
  }

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
      ref={announcementRef}
    >
      {announcement}
    </div>
  );
}

// Extend the Window interface to include our global announce function
declare global {
  interface Window {
    announce?: (message: string, priority?: 'polite' | 'assertive') => void;
  }
}
