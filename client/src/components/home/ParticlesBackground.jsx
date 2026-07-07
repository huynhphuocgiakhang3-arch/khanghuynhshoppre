'use client';

import { useEffect, useRef } from 'react';

/**
 * Nen "Particles Background": cac hat sang nho troi nhe nhang, mo phong tan lua/
 * bui kim cuong - hop voi theme "Inferno Gaming" cua shop. Dung Canvas API thuan,
 * khong phu thuoc thu vien ngoai de giu bundle nhe.
 */
export default function ParticlesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const colors = ['rgba(255,87,34,0.5)', 'rgba(245,185,66,0.45)', 'rgba(255,122,69,0.35)'];

    const createParticles = () => {
      const count = Math.min(60, Math.floor(canvas.offsetWidth / 18));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        radius: Math.random() * 2.6 + 1.1,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = canvas.offsetHeight + 10;
          p.x = Math.random() * canvas.offsetWidth;
        }
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();

    if (!prefersReducedMotion) {
      draw();
    } else {
      // Neu nguoi dung tat motion, ve mot khung hinh tinh roi dung
      draw();
      cancelAnimationFrame(animationId);
    }

    const handleResize = () => {
      resize();
      createParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particles-bg w-full h-full"
      aria-hidden="true"
    />
  );
}
