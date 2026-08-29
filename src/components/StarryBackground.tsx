import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number; // 0: far/small, 1: mid, 2: near/large
  color: string;
  hasFlare: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  opacity: number;
  maxOpacity: number;
  trailColor: string;
  headColor: string;
  width: number;
  life: number;
  maxLife: number;
  direction: "ltr" | "rtl";
}

export const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palettes for stars
    const starColors = [
      "rgba(255, 255, 255,", // Pure brilliant white
      "rgba(240, 246, 255,", // Cool diamond blue
      "rgba(255, 244, 214,", // Soft warm gold
      "rgba(255, 224, 163,", // Amber tint
      "rgba(224, 242, 254,", // Cyan shimmer
    ];

    // Generate stratified 3D stars
    const stars: Star[] = [];
    const createStars = () => {
      stars.length = 0;
      // Calculate star count based on screen area
      const starDensity = Math.floor((width * height) / 7500);
      const totalStars = Math.max(140, Math.min(starDensity, 300));

      for (let i = 0; i < totalStars; i++) {
        const layerRand = Math.random();
        let layer = 0; // Far / small
        let size = Math.random() * 1.0 + 0.5;
        let baseAlpha = Math.random() * 0.4 + 0.2;
        let twinkleSpeed = Math.random() * 0.02 + 0.008;
        let hasFlare = false;

        if (layerRand > 0.88) {
          // Large foreground star with 3D glow & lens flare
          layer = 2;
          size = Math.random() * 1.8 + 2.2;
          baseAlpha = Math.random() * 0.35 + 0.65;
          twinkleSpeed = Math.random() * 0.04 + 0.02;
          hasFlare = Math.random() > 0.35;
        } else if (layerRand > 0.55) {
          // Medium star
          layer = 1;
          size = Math.random() * 1.0 + 1.2;
          baseAlpha = Math.random() * 0.35 + 0.45;
          twinkleSpeed = Math.random() * 0.025 + 0.012;
        }

        const colorPrefix = starColors[Math.floor(Math.random() * starColors.length)];

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          baseAlpha,
          alpha: baseAlpha,
          twinkleSpeed,
          twinklePhase: Math.random() * Math.PI * 2,
          layer,
          color: colorPrefix,
          hasFlare,
        });
      }
    };

    createStars();

    // Shooting stars management
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = Date.now() + 1500; // First one shortly after mount

    const spawnShootingStar = () => {
      // Alternate or randomize direction: 'ltr' (links nach rechts) or 'rtl' (rechts nach links)
      const isLtr = Math.random() > 0.45;
      const angleDeg = isLtr
        ? Math.random() * 20 + 20 // 20 to 40 degrees down-right
        : Math.random() * 20 + 140; // 140 to 160 degrees down-left

      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = Math.random() * 14 + 18;
      const length = Math.random() * 120 + 110;
      const maxLife = Math.random() * 45 + 40;

      const startX = isLtr
        ? Math.random() * (width * 0.7)
        : Math.random() * (width * 0.7) + width * 0.3;
      const startY = Math.random() * (height * 0.45);

      const headColors = [
        "rgba(255, 255, 255,",
        "rgba(255, 244, 214,",
        "rgba(224, 242, 254,",
        "rgba(254, 240, 138,"
      ];
      const trailColors = [
        "rgba(96, 165, 250,",
        "rgba(251, 191, 36,",
        "rgba(56, 189, 248,",
        "rgba(226, 232, 240,"
      ];

      shootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angleRad) * speed,
        dy: Math.sin(angleRad) * speed,
        length,
        speed,
        opacity: 0,
        maxOpacity: Math.random() * 0.4 + 0.6,
        headColor: headColors[Math.floor(Math.random() * headColors.length)],
        trailColor: trailColors[Math.floor(Math.random() * trailColors.length)],
        width: Math.random() * 1.5 + 1.2,
        life: 0,
        maxLife,
        direction: isLtr ? "ltr" : "rtl",
      });

      // Next shooting star in 3 to 6.5 seconds
      nextShootingStarTime = Date.now() + (Math.random() * 3500 + 3000);
    };

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      // Spawn shooting star if interval reached
      if (now >= nextShootingStarTime) {
        spawnShootingStar();
      }

      // Draw all stationary 3D stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Calculate twinkle with smooth sine wave oscillation
        star.twinklePhase += star.twinkleSpeed;
        const sineVal = Math.sin(star.twinklePhase);
        
        // Depth-dependent blinking intensity
        const variation = star.layer === 2 ? 0.45 : star.layer === 1 ? 0.3 : 0.2;
        star.alpha = Math.max(0.05, Math.min(1, star.baseAlpha + sineVal * variation));

        ctx.fillStyle = `${star.color} ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 3D Soft Glow halo for large foreground stars
        if (star.layer === 2) {
          ctx.beginPath();
          const glowGrad = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.size * 3.5
          );
          glowGrad.addColorStop(0, `${star.color} ${star.alpha * 0.45})`);
          glowGrad.addColorStop(0.5, `${star.color} ${star.alpha * 0.15})`);
          glowGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowGrad;
          ctx.arc(star.x, star.y, star.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Delicate 4-point cross-flare for sparkling diamond effect
          if (star.hasFlare && star.alpha > 0.5) {
            const flareLen = star.size * (2.8 + sineVal * 1.2);
            ctx.strokeStyle = `${star.color} ${star.alpha * 0.5})`;
            ctx.lineWidth = 0.6;

            ctx.beginPath();
            // Horizontal flare
            ctx.moveTo(star.x - flareLen, star.y);
            ctx.lineTo(star.x + flareLen, star.y);
            // Vertical flare
            ctx.moveTo(star.x, star.y - flareLen);
            ctx.lineTo(star.x, star.y + flareLen);
            ctx.stroke();
          }
        }
      }

      // Draw active shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life++;
        s.x += s.dx;
        s.y += s.dy;

        // Smooth fade-in and fade-out life curve
        const progress = s.life / s.maxLife;
        if (progress < 0.25) {
          s.opacity = (progress / 0.25) * s.maxOpacity;
        } else {
          s.opacity = (1 - (progress - 0.25) / 0.75) * s.maxOpacity;
        }

        if (s.life >= s.maxLife || s.x < -100 || s.x > width + 100 || s.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Calculate tail coordinate based on direction vector
        const angle = Math.atan2(s.dy, s.dx);
        const tailX = s.x - Math.cos(angle) * s.length;
        const tailY = s.y - Math.sin(angle) * s.length;

        // Gradient trail
        const gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        gradient.addColorStop(0.6, `${s.trailColor} ${s.opacity * 0.6})`);
        gradient.addColorStop(0.9, `${s.headColor} ${s.opacity * 0.95})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 1)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Glowing bright head
        ctx.beginPath();
        const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        headGlow.addColorStop(0.4, `${s.headColor} ${s.opacity * 0.8})`);
        headGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = headGlow;
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Handle visibility change to save CPU when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-black">
      {/* Subtle deep nebula gradients in background for depth */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212, 175, 55, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 85% 60%, rgba(56, 189, 248, 0.08), transparent 60%), radial-gradient(ellipse 70% 50% at 15% 75%, rgba(168, 85, 247, 0.06), transparent 70%)"
        }}
      />
      
      {/* Animated 3D Star Canvas & Shooting Stars */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};

export default StarryBackground;
