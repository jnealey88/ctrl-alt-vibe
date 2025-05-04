import React, { useState, useEffect } from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number;
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

/**
 * AccessibilityAnnouncer
 * 
 * A component that announces messages to screen readers without
 * visually displaying them on the page. Uses aria-live regions.
 * 
 * @param {string} message - The message to announce
 * @param {boolean} assertive - Whether to use an assertive (true) or polite (false) live region
 * @param {number} clearAfter - Time in ms after which to clear the announcement
 */
export function AccessibilityAnnouncer({
  message,
  assertive = false,
  clearAfter = 5000,
}: AccessibilityAnnouncerProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    if (message) {
      setAnnouncement(message);

      // Clear announcement after specified duration
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!message) return null;

  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      style={visuallyHiddenStyle}
    >
      {announcement}
    </div>
  );
}

/**
 * SkipToContent
 * 
 * A component that provides a skip link for keyboard users to bypass
 * navigation and move directly to the main content.
 * 
 * @param {string} targetId - The ID of the main content element to skip to
 */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  const [isFocused, setIsFocused] = useState(false);

  const skipLinkStyle: React.CSSProperties = {
    ...visuallyHiddenStyle,
    ...(
      isFocused ? {
        position: 'fixed',
        top: '10px',
        left: '10px',
        width: 'auto',
        height: 'auto',
        padding: '10px 15px',
        margin: '0',
        overflow: 'visible',
        clip: 'auto',
        backgroundColor: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
      } : {}
    ),
  };

  return (
    <a
      href={`#${targetId}`}
      className="text-primary font-medium focus:outline-none"
      style={skipLinkStyle}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      Skip to main content
    </a>
  );
}

/**
 * useAnnouncement hook
 * 
 * A custom hook to manage screen reader announcements via the AccessibilityAnnouncer.
 * 
 * @returns {Object} - Functions to make announcements
 */
export function useAnnouncement() {
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');

  // For regular, non-urgent updates
  const announce = (message: string) => {
    setPoliteAnnouncement(message);
  };

  // For important updates that should interrupt the user
  const announceAssertive = (message: string) => {
    setAssertiveAnnouncement(message);
  };

  const AnnouncementRegion = () => (
    <>
      {politeAnnouncement && (
        <AccessibilityAnnouncer message={politeAnnouncement} assertive={false} />
      )}
      {assertiveAnnouncement && (
        <AccessibilityAnnouncer message={assertiveAnnouncement} assertive={true} />
      )}
    </>
  );

  return {
    announce,
    announceAssertive,
    AnnouncementRegion,
  };
}
