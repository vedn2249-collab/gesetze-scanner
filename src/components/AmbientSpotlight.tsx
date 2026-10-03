import React, { useEffect, useState } from "react";

export const AmbientSpotlight: React.FC = () => {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on fine pointer devices (desktop mouse)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    if (!mediaQuery.matches) return;

    let rafId: number | null = null;
    let targetX = -1000;
    let targetY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsVisible(true);

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setPos({ x: targetX, y: targetY });
          rafId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-500 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        background: `radial-gradient(650px circle at ${pos.x}px ${pos.y}px, rgba(212, 175, 55, 0.045), rgba(56, 189, 248, 0.015) 45%, transparent 75%)`,
      }}
      aria-hidden="true"
    />
  );
};

export default AmbientSpotlight;
