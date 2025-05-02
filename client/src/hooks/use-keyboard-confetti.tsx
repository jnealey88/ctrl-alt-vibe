import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  scalar?: number;
  ticks?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
  shapes?: string[];
  zIndex?: number;
};

/**
 * A hook that triggers confetti animation when Ctrl+Alt+V (or Cmd+Alt+V on Mac) is pressed
 */
export function useKeyboardConfetti(options: ConfettiOptions = {}) {
  const triggerConfetti = useCallback(() => {
    const defaults = {
      particleCount: 150,
      spread: 90,
      startVelocity: 45,
      decay: 0.92,
      gravity: 1.5,
      ticks: 200,
      zIndex: 1000,
      colors: ['#0e78f9', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b']
    };

    // Create wave from left to right
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      // Calculate how far through the animation we are (0-1)
      const timeLeft = end - Date.now();
      const progress = 1 - timeLeft / duration;

      // Launch confetti from the left edge
      confetti({
        ...defaults,
        ...options,
        origin: { x: progress, y: 0.5 },
        particleCount: 2,
      });

      // Launch confetti from the right edge
      confetti({
        ...defaults,
        ...options,
        origin: { x: 1 - progress, y: 0.5 },
        particleCount: 2,
      });

      // Keep launching until we're done
      if (timeLeft > 0) {
        requestAnimationFrame(frame);
      }
    })();
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Mac: Command+Ctrl+V, Windows/Linux: Ctrl+Alt+V
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      
      if (isMac) {
        // Mac shortcut: Command (metaKey) + Ctrl + V
        if (event.metaKey && event.ctrlKey && event.key.toLowerCase() === 'v') {
          event.preventDefault();
          triggerConfetti();
        }
      } else {
        // Windows/Linux: Ctrl + Alt + V
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'v') {
          event.preventDefault();
          triggerConfetti();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerConfetti]);

  return { triggerConfetti };
}
