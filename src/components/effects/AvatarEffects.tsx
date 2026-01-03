import { useEffect, useRef } from 'react';

export type AvatarEffectType = 
  | 'none'
  | 'sparkle'
  | 'glow'
  | 'pulse'
  | 'rainbow'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'golden'
  | 'mystic';

interface AvatarEffectsProps {
  effect: AvatarEffectType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export default function AvatarEffects({ effect, size = 'md', children }: AvatarEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getSizePixels = () => {
    switch (size) {
      case 'sm': return 48;
      case 'md': return 80;
      case 'lg': return 120;
      case 'xl': return 160;
      default: return 80;
    }
  };

  useEffect(() => {
    if (effect === 'none' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = getSizePixels();
    canvas.width = pixels;
    canvas.height = pixels;

    let animationId: number;
    let particles: any[] = [];
    let time = 0;

    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, pixels, pixels);

      switch (effect) {
        case 'sparkle':
          animateSparkle(ctx, pixels, time);
          break;
        case 'fire':
          animateFire(ctx, pixels, time);
          break;
        case 'electric':
          animateElectric(ctx, pixels, time);
          break;
      }

      animationId = requestAnimationFrame(animate);
    };

    if (['sparkle', 'fire', 'electric'].includes(effect)) {
      animate();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [effect, size]);

  const animateSparkle = (ctx: CanvasRenderingContext2D, size: number, time: number) => {
    const sparkleCount = 6;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (time + i * Math.PI * 2 / sparkleCount) * 2;
      const radius = size * 0.45;
      const x = size / 2 + Math.cos(angle) * radius;
      const y = size / 2 + Math.sin(angle) * radius;
      const sparkleSize = 2 + Math.sin(time * 3 + i) * 1.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time * 4 + i) * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
      ctx.fill();

      // Add cross sparkle
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 4 + i) * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - sparkleSize * 2, y);
      ctx.lineTo(x + sparkleSize * 2, y);
      ctx.moveTo(x, y - sparkleSize * 2);
      ctx.lineTo(x, y + sparkleSize * 2);
      ctx.stroke();
    }
  };

  const animateFire = (ctx: CanvasRenderingContext2D, size: number, time: number) => {
    const flameCount = 8;
    for (let i = 0; i < flameCount; i++) {
      const angle = i * Math.PI * 2 / flameCount + time;
      const radius = size * 0.42 + Math.sin(time * 3 + i) * 3;
      const x = size / 2 + Math.cos(angle) * radius;
      const y = size / 2 + Math.sin(angle) * radius;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
      gradient.addColorStop(0, `rgba(255, 200, 0, ${0.8 + Math.sin(time * 4 + i) * 0.2})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.5})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const animateElectric = (ctx: CanvasRenderingContext2D, size: number, time: number) => {
    ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 + Math.sin(time * 10) * 0.4})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';

    const points = 12;
    const radius = size * 0.43;
    for (let i = 0; i < points; i++) {
      if (Math.random() > 0.7) {
        const angle1 = (i / points) * Math.PI * 2;
        const angle2 = ((i + 1) / points) * Math.PI * 2;
        const x1 = size / 2 + Math.cos(angle1) * radius;
        const y1 = size / 2 + Math.sin(angle1) * radius;
        const x2 = size / 2 + Math.cos(angle2) * radius;
        const y2 = size / 2 + Math.sin(angle2) * radius;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  };

  const getEffectClasses = () => {
    const baseClasses = 'relative overflow-hidden rounded-full w-full h-full';
    switch (effect) {
      case 'glow':
        return `${baseClasses} shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse`;
      case 'pulse':
        return `${baseClasses} animate-pulse`;
      case 'rainbow':
        return `${baseClasses} rainbow-border`;
      case 'golden':
        return `${baseClasses} shadow-[0_0_20px_rgba(250,204,21,0.8)]`;
      case 'mystic':
        return `${baseClasses} shadow-[0_0_25px_rgba(168,85,247,0.9)] mystic-glow`;
      case 'ice':
        return `${baseClasses} shadow-[0_0_20px_rgba(147,197,253,0.8)]`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={getEffectClasses()}>
      {['sparkle', 'fire', 'electric'].includes(effect) && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 rounded-full"
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {children}
      
      <style jsx>{`
        .rainbow-border {
          animation: rainbow-rotate 3s linear infinite;
          border: 3px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) border-box;
          border-radius: 50%;
        }

        @keyframes rainbow-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        .mystic-glow {
          animation: mystic-pulse 2s ease-in-out infinite;
        }

        @keyframes mystic-pulse {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(168,85,247,0.9), 0 0 50px rgba(168,85,247,0.5);
          }
          50% { 
            box-shadow: 0 0 35px rgba(168,85,247,1), 0 0 70px rgba(168,85,247,0.7);
          }
        }
      `}</style>
    </div>
  );
}
