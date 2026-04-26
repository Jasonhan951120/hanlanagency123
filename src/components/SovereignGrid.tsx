import { useEffect, useRef } from "react";

/**
 * SovereignGrid - High-Impact Sovereign Energy Flux
 * A dramatic, glowing neural network designed for maximum cinematic impact.
 * Combines engineered precision with a vibrant, high-energy aesthetic.
 */
export default function SovereignGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let cx = w / 2;
    let cy = h / 2;

    const filamentCount = 64; // Increased density
    const filaments: any[] = [];

    class Filament {
      angle: number;
      radius: number;
      arcLength: number;
      speed: number;
      offset: number;
      thickness: number;
      colorIndex: number;
      signals: any[] = [];

      constructor(index: number) {
        this.angle = (index / filamentCount) * Math.PI * 2;
        this.radius = 200 + Math.random() * 600;
        this.arcLength = 0.8 + Math.random() * 2;
        this.speed = 0.0003 + Math.random() * 0.0005; // Faster for energy
        this.offset = Math.random() * Math.PI * 2;
        this.thickness = 0.8 + Math.random() * 1.2;
        this.colorIndex = index % 3; // Cycle through theme colors
      }

      updateSignals() {
        if (Math.random() < 0.01 && this.signals.length < 3) {
          this.signals.push({ pos: 0, speed: 0.004 + Math.random() * 0.006 });
        }
        for (let i = this.signals.length - 1; i >= 0; i--) {
          this.signals[i].pos += this.signals[i].speed;
          if (this.signals[i].pos > 1) this.signals.splice(i, 1);
        }
      }

      draw(frames: number) {
        const t = frames * this.speed + this.offset;
        const currentAngle = this.angle + Math.sin(t * 0.4) * 0.15;
        
        // High-Impact Physics: Elliptical orbits with intentional tilt
        const rx = this.radius;
        const ry = this.radius * 0.55;
        
        const startX = cx + Math.cos(currentAngle) * rx;
        const startY = cy + Math.sin(currentAngle) * ry;
        
        const endAngle = currentAngle + this.arcLength;
        const endX = cx + Math.cos(endAngle) * rx;
        const endY = cy + Math.sin(endAngle) * ry;

        // Interaction (Surgical Bending)
        const dx = mouseRef.current.x - (startX + endX) / 2;
        const dy = mouseRef.current.y - (startY + endY) / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 350);
        
        const bendX = dx * influence * 0.2;
        const bendY = dy * influence * 0.2;

        const cpX = cx + Math.cos(currentAngle + this.arcLength / 2) * (rx * 1.2) + bendX;
        const cpY = cy + Math.sin(currentAngle + this.arcLength / 2) * (ry * 1.2) + bendY;

        // HIGH IMPACT RENDERING
        ctx.beginPath();
        ctx.lineWidth = this.thickness * (1 + influence * 0.5);
        
        // Multichromatic theme: Hanlan Pink (#EDC2DC) + Violet (#8B5CF6)
        let hue = 325; // Pink
        if (this.colorIndex === 1) hue = 260; // Violet
        if (this.colorIndex === 2) hue = 340; // Brighter Pink
        
        const baseOpacity = 0.072 + (influence * 0.225);
        const color = `hsla(${hue}, 65%, 82%, ${baseOpacity})`;
        
        ctx.strokeStyle = color;
        ctx.shadowBlur = influence > 0.1 ? 12 : 2;
        ctx.shadowColor = `hsla(${hue}, 70%, 75%, 0.5)`;

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Data Pulsing Signals
        this.signals.forEach(s => {
          const tPos = s.pos;
          const uPos = 1 - tPos;
          const sX = uPos * uPos * startX + 2 * uPos * tPos * cpX + tPos * tPos * endX;
          const sY = uPos * uPos * startY + 2 * uPos * tPos * cpY + tPos * tPos * endY;
          
          const sAlpha = Math.sin(s.pos * Math.PI) * 0.6;
          ctx.beginPath();
          ctx.arc(sX, sY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(246, 212, 232, ${sAlpha})`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#EDC2DC";
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
    }

    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      filaments.length = 0;
      for (let i = 0; i < filamentCount; i++) {
        filaments.push(new Filament(i));
      }
    };

    let frames = 0;
    let rafId: number;
    const animate = () => {
      frames++;
      ctx.clearRect(0, 0, w, h);
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      filaments.forEach(f => {
        f.updateSignals();
        f.draw(frames);
      });

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.75);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.1)");
      grad.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    
    init();
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[0] w-full h-full pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
