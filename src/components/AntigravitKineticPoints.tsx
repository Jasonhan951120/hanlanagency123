import { useEffect, useRef } from 'react';

/**
 * AntigravitKineticPoints
 * High-fidelity kinetic art component featuring 5 soft energy blobs with inverse-motion gravity logic.
 * Developed by Senior Creative Developer.
 */

interface Point {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  seedX: number;
  seedY: number;
  distToCursor: number;
}

export default function AntigravitKineticPoints() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    
    const colors = [
      '#a68b9a', '#a68b9a', '#a68b9a', '#a68b9a', '#a68b9a', // Muted Dusty Pink
      '#4f4a73', '#4f4a73', '#4f4a73', '#4f4a73', '#4f4a73'  // Muted Deep Violet
    ];
    
    const initPoints = () => {
      const pts: Point[] = [];
      for (let i = 0; i < 10; i++) {
        // Bias towards the right side (60% to 90% width)
        const startX = width * 0.6 + Math.random() * (width * 0.3);
        const startY = height * 0.2 + Math.random() * (height * 0.6);
        
        pts.push({
          x: startX,
          y: startY,
          targetX: 0,
          targetY: 0,
          vx: 0,
          vy: 0,
          radius: 35 + Math.random() * 25,
          color: colors[i],
          seedX: Math.random() * 1000,
          seedY: Math.random() * 1000,
          distToCursor: 0
        });
      }
      pointsRef.current = pts;
    };

    const resize = () => {
      if (!containerRef.current) return;
      width = canvas.width = containerRef.current.clientWidth;
      height = canvas.height = containerRef.current.clientHeight;
      if (pointsRef.current.length === 0) initPoints();
    };

    window.addEventListener('resize', resize);
    resize();

    let rafId: number;
    let time = 0;

    const animate = () => {
      time += 0.003; 
      ctx.fillStyle = '#000000'; 
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const points = pointsRef.current;
      
      let centerX = 0;
      let centerY = 0;
      points.forEach(p => {
        centerX += p.x;
        centerY += p.y;
      });
      centerX /= points.length;
      centerY /= points.length;

      const distToCentroid = Math.sqrt((mouse.x - centerX) ** 2 + (mouse.y - centerY) ** 2);
      const isInteracting = distToCentroid < 500; 

      if (isInteracting) {
        points.forEach(p => {
          p.distToCursor = Math.sqrt((mouse.x - p.x) ** 2 + (mouse.y - p.y) ** 2);
        });
        
        const sorted = [...points].sort((a, b) => a.distToCursor - b.distToCursor);
        
        const slotCount = 10;
        // Diagonal centered on the right-ish area
        const diagonalSize = Math.min(width, height) * 0.7;
        const startX = width * 0.7 - diagonalSize / 2;
        const startY = height / 2 - diagonalSize / 2;
        
        const distToStart = Math.sqrt((mouse.x - startX) ** 2 + (mouse.y - startY) ** 2);
        const distToEnd = Math.sqrt((mouse.x - (startX + diagonalSize)) ** 2 + (mouse.y - (startY + diagonalSize)) ** 2);
        const mouseAtStart = distToStart < distToEnd;

        sorted.forEach((p, i) => {
          const slotIndex = mouseAtStart ? (slotCount - 1 - i) : i;
          const progress = slotIndex / (slotCount - 1);
          p.targetX = startX + diagonalSize * progress;
          p.targetY = startY + diagonalSize * progress;
        });
      } else {
        points.forEach(p => {
          // Brownian motion with a right-side bias anchor
          const anchorX = width * 0.75;
          const anchorY = height * 0.5;
          
          p.targetX = p.x + (Math.sin(time + p.seedX) * 1.2) + (anchorX - p.x) * 0.005;
          p.targetY = p.y + (Math.cos(time + p.seedY) * 1.2) + (anchorY - p.y) * 0.005;
          
          // Soft boundaries
          if (p.x < -200) p.x = width + 200;
          if (p.x > width + 200) p.x = -200;
          if (p.y < -200) p.y = height + 200;
          if (p.y > height + 200) p.y = -200;
        });
      }

      const k = 0.03; // Even softer for large scale
      const b = 0.94; // More liquid damping

      points.forEach(p => {
        const ax = (p.targetX - p.x) * k;
        const ay = (p.targetY - p.y) * k;
        
        p.vx = (p.vx + ax) * b;
        p.vy = (p.vy + ay) * b;
        
        p.x += p.vx;
        p.y += p.vy;

        // Render Blob
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, p.color + '44'); // Muted brightness (alpha 25%)
        gradient.addColorStop(0.5, p.color + '22'); // Fade out
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      rafId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
