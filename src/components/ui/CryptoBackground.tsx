import React, { useEffect, useRef } from 'react';

const CryptoBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const bubbles: { x: number; y: number; size: number; speedX: number; speedY: number; hue: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      stars.length = 0;
      bubbles.length = 0;

      const starCount = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.8 + 0.2,
        });
      }

      for (let i = 0; i < 15; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 60 + 25,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          hue: Math.random() * 60 + 200,
          opacity: Math.random() * 0.1 + 0.05,
        });
      }
    };

    const draw = (time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#030712');
      gradient.addColorStop(0.5, '#0a0f1a');
      gradient.addColorStop(1, '#0d1117');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula
      const nebula1 = ctx.createRadialGradient(0, canvas.height, 0, 0, canvas.height, canvas.height * 0.6);
      nebula1.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      nebula1.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nebula2 = ctx.createRadialGradient(canvas.width, 0, 0, canvas.width, 0, canvas.width * 0.5);
      nebula2.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      nebula2.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bubbles
      bubbles.forEach((b) => {
        b.x += b.speedX;
        b.y += b.speedY;
        if (b.x < -b.size) b.x = canvas.width + b.size;
        if (b.x > canvas.width + b.size) b.x = -b.size;
        if (b.y < -b.size) b.y = canvas.height + b.size;
        if (b.y > canvas.height + b.size) b.y = -b.size;

        const pulse = Math.sin(time * 0.001 + b.hue) * 0.15 + 1;
        const size = b.size * pulse;
        const bubbleGrad = ctx.createRadialGradient(b.x - size * 0.3, b.y - size * 0.3, 0, b.x, b.y, size);
        bubbleGrad.addColorStop(0, `hsla(${b.hue}, 70%, 60%, ${b.opacity})`);
        bubbleGrad.addColorStop(0.6, `hsla(${b.hue}, 60%, 50%, ${b.opacity * 0.4})`);
        bubbleGrad.addColorStop(1, `hsla(${b.hue}, 50%, 40%, 0)`);
        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stars
      stars.forEach((s) => {
        const twinkle = Math.sin(time * s.speed + s.x) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        if (s.size > 1.5) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
          glow.addColorStop(0, `rgba(255, 255, 255, ${s.opacity * twinkle * 0.4})`);
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Planet
      const px = canvas.width * 0.88;
      const py = canvas.height * 0.12;
      const pr = Math.min(canvas.width, canvas.height) * 0.09;

      const planetGlow = ctx.createRadialGradient(px, py, pr * 0.5, px, py, pr * 2.5);
      planetGlow.addColorStop(0, 'rgba(240, 185, 11, 0.3)');
      planetGlow.addColorStop(0.5, 'rgba(240, 185, 11, 0.1)');
      planetGlow.addColorStop(1, 'rgba(240, 185, 11, 0)');
      ctx.fillStyle = planetGlow;
      ctx.beginPath();
      ctx.arc(px, py, pr * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const planetGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
      planetGrad.addColorStop(0, '#FFD93D');
      planetGrad.addColorStop(0.5, '#F0B90B');
      planetGrad.addColorStop(1, '#B8860B');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Ring
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(0.4);
      ctx.scale(1, 0.3);
      const ringGrad = ctx.createLinearGradient(-pr * 1.8, 0, pr * 1.8, 0);
      ringGrad.addColorStop(0, 'rgba(240, 185, 11, 0)');
      ringGrad.addColorStop(0.3, 'rgba(240, 185, 11, 0.6)');
      ringGrad.addColorStop(0.5, 'rgba(255, 217, 61, 0.8)');
      ringGrad.addColorStop(0.7, 'rgba(240, 185, 11, 0.6)');
      ringGrad.addColorStop(1, 'rgba(240, 185, 11, 0)');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.6, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.restore();

      // Orbiting particles
      for (let i = 0; i < 5; i++) {
        const angle = (time * 0.0008 + (i * Math.PI * 2) / 5) % (Math.PI * 2);
        const ox = px + Math.cos(angle) * pr * 1.8;
        const oy = py + Math.sin(angle) * pr * 1.8 * 0.3;
        ctx.fillStyle = `rgba(255, 217, 61, ${0.5 + Math.sin(time * 0.003 + i) * 0.3})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
};

export default CryptoBackground;
