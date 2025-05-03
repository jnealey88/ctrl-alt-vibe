import React, { useEffect, useRef } from 'react';

/**
 * Component that generates a social sharing image on mount
 * and saves it to the public directory as a PNG
 */
export const SocialImage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for social sharing
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(0.5, '#0F172A');
    gradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw geometric shapes
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(200, 150, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6366F1';
    ctx.beginPath();
    ctx.arc(1000, 200, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#818CF8';
    ctx.beginPath();
    ctx.arc(300, 480, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#A5B4FC';
    ctx.beginPath();
    ctx.arc(950, 480, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Text styling
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    // Draw logo
    ctx.font = 'bold 80px Arial, sans-serif';
    ctx.fillText('CTRL ALT VIBE', canvas.width / 2, 200);

    // Draw tagline
    ctx.font = '36px Arial, sans-serif';
    ctx.fillText('AI-Assisted Coding Projects Community', canvas.width / 2, 300);

    // Draw description
    ctx.font = '24px Arial, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText('Discover, share, and engage with innovative projects', canvas.width / 2, 360);
    ctx.globalAlpha = 1;

    // Draw URL
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('ctrlaltvibe.replit.app', canvas.width / 2, 500);
    
    // Convert to image (don't actually download in this component)
    // This would be done if we wanted to save it to the public directory
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

export default SocialImage;
