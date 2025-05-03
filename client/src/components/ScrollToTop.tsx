import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Component that scrolls to the top of the page whenever the route changes
 * This improves user experience by ensuring content always starts at the top when navigating
 */
const ScrollToTop = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top with smooth behavior when location changes
    // Using setTimeout to ensure it happens after the DOM update
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);

  // This component doesn't render anything visible
  return null;
};

export default ScrollToTop;
