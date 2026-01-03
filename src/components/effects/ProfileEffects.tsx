import { useEffect, useRef } from 'react';

export type ProfileEffectType = 
  | 'none'
  | 'particles'
  | 'snow'
  | 'matrix'
  | 'nebula'
  | 'waves'
  | 'fireflies'
  | 'stars'
  | 'aurora';

interface ProfileEffectsProps {
  effect: ProfileEffectType;
  className?: string;
}

export default function ProfileEffects({ effect, className = '' }: ProfileEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === 'none' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animationId: number;
    let particles: Particle[] = [];
    let time = 0;
    let matrixDrops: number[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      life: number;

      constructor(width: number, height: number, effectType: ProfileEffectType) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.life = Math.random();
        
        switch (effectType) {
          case 'particles':
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.color = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 150}, 255, ${this.opacity})`;
            break;
          case 'snow':
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = Math.random() * 1 + 0.5;
            this.color = `rgba(255, 255, 255, ${this.opacity})`;
            break;
          case 'fireflies':
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.color = `rgba(255, ${Math.random() * 100 + 155}, 50, ${this.opacity})`;
            break;
          case 'stars':
            this.vx = 0;
            this.vy = 0;
            this.color = `rgba(255, 255, 255, ${this.opacity})`;
            this.size = Math.random() * 2 + 0.5;
            break;
          default:
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.color = `rgba(255, 255, 255, ${this.opacity})`;
        }
      }

      update(width: number, height: number, effectType: ProfileEffectType) {
        this.x += this.vx;
        this.y += this.vy;

        if (effectType === 'fireflies') {
          this.opacity = 0.3 + Math.sin(this.life * Math.PI * 2) * 0.7;
          this.life += 0.02;
          if (this.life > 1) this.life = 0;
        }

        if (effectType === 'stars') {
          this.opacity = 0.2 + Math.sin(this.life * Math.PI) * 0.8;
          this.life += 0.01;
          if (this.life > 1) this.life = 0;
        }

        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D, effectType: ProfileEffectType) {
        ctx.save();
        
        if (effectType === 'fireflies' || effectType === 'stars') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Initialize particles
    const particleCount = effect === 'snow' ? 100 : effect === 'stars' ? 150 : 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height, effect));
    }

    const drawMatrix = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      const chars = '01アイウエオカキクケコサシスセソ';
      const fontSize = 14;
      const columns = Math.floor(width / fontSize);
      
      // Initialize drops array only once
      if (matrixDrops.length === 0) {
        matrixDrops = Array(columns).fill(1).map(() => Math.floor(Math.random() * height / fontSize));
      }
      
      // Adjust drops array if width changed
      if (matrixDrops.length !== columns) {
        matrixDrops = Array(columns).fill(1).map(() => Math.floor(Math.random() * height / fontSize));
      }

      // Create fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      // Draw each column
      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = matrixDrops[i] * fontSize;

        ctx.fillText(char, x, y);

        // Reset drop to top when it reaches bottom
        if (y > height && Math.random() > 0.975) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
    };

    const drawNebula = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < 3; i++) {
        const x = width / 2 + Math.sin(time * 0.5 + i) * width * 0.3;
        const y = height / 2 + Math.cos(time * 0.3 + i) * height * 0.3;
        const radius = 150 + Math.sin(time + i) * 50;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${100 + i * 50}, ${50 + i * 30}, ${200 + i * 20}, 0.3)`);
        gradient.addColorStop(0.5, `rgba(${100 + i * 50}, ${50 + i * 30}, ${200 + i * 20}, 0.1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const drawWaves = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 + i * 0.05})`;
        ctx.lineWidth = 2;

        for (let x = 0; x < width; x += 5) {
          const y = height / 2 + Math.sin((x + time * 50 + i * 50) * 0.01) * (30 + i * 10);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    const drawAurora = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < 4; i++) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(${100 + i * 30}, ${200 - i * 20}, ${255 - i * 30}, ${0.1 + Math.sin(time + i) * 0.05})`);
        gradient.addColorStop(0.5, `rgba(${150 + i * 20}, ${100 + i * 30}, ${255 - i * 20}, ${0.15})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 10) {
          const y = height * 0.3 + Math.sin((x + time * 100 + i * 100) * 0.005) * 50;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
      }
    };

    const animate = () => {
      time += 0.016;

      switch (effect) {
        case 'particles':
        case 'snow':
        case 'fireflies':
        case 'stars':
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(particle => {
            particle.update(canvas.width, canvas.height, effect);
            particle.draw(ctx, effect);
          });
          break;
        case 'matrix':
          drawMatrix(ctx, canvas.width, canvas.height, time);
          break;
        case 'nebula':
          drawNebula(ctx, canvas.width, canvas.height, time);
          break;
        case 'waves':
          drawWaves(ctx, canvas.width, canvas.height, time);
          break;
        case 'aurora':
          drawAurora(ctx, canvas.width, canvas.height, time);
          break;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
