"use client";

import { useEffect, useRef, useState } from "react";

export function HoverZoom({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showZoom, setShowZoom] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const target = useRef({ x: 50, y: 50 });
  const current = useRef({ x: 50, y: 50 });

  const [bgPosition, setBgPosition] = useState("50% 50%");
  const [lensStyle, setLensStyle] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const hasTouch = window.matchMedia("(hover: none)").matches;
    setIsDesktop(!hasTouch);
  }, []);

  useEffect(() => {
    let raf: number;

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.15;
      current.current.y += (target.current.y - current.current.y) * 0.15;

      setBgPosition(`${current.current.x}% ${current.current.y}%`);

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const xPercent = (xPx / rect.width) * 100;
    const yPercent = (yPx / rect.height) * 100;

    target.current = { x: xPercent, y: yPercent };

    const lensSize = 120;

    setLensStyle({
      left: xPx - lensSize / 2,
      top: yPx - lensSize / 2,
    });
  };

  return (
    <div className="relative flex">
      <div
        ref={containerRef}
        className="relative cursor-zoom-in"
        onMouseEnter={() => isDesktop && setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={src} className="w-full h-auto object-cover" />

        {showZoom && isDesktop && (
          <div
            className="absolute pointer-events-none border border-black/20 bg-white/30 backdrop-blur-[2px] rounded-md"
            style={{
              width: 120,
              height: 120,
              left: lensStyle.left,
              top: lensStyle.top,
            }}
          />
        )}
      </div>

      {showZoom && isDesktop && (
        <div className="absolute left-full ml-6 top-0 w-[500px] h-[500px] border bg-white shadow-xl z-50 overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${src})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "200%",
              backgroundPosition: bgPosition,
            }}
          />
        </div>
      )}
    </div>
  );
}