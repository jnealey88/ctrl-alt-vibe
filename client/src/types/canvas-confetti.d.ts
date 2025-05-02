declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  type ConfettiFunction = (options?: ConfettiOptions) => Promise<null>;

  interface ConfettiCanvas {
    reset: () => void;
    fire: (options?: ConfettiOptions) => Promise<null>;
  }

  const confetti: ConfettiFunction & {
    reset: () => void;
    create: (canvas: HTMLCanvasElement, options?: ConfettiOptions) => ConfettiCanvas;
  };

  export default confetti;
}
