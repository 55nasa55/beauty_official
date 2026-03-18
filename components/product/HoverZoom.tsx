"use client";

import { useState } from "react";

export function HoverZoom({ src }: { src: string }) {
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      className="relative cursor-zoom-in w-full h-full"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />

      {showZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none hidden md:flex">
          <div className="w-[500px] h-[500px] overflow-hidden rounded-xl shadow-2xl bg-white">
            <img
              src={src}
              alt=""
              className="w-[150%] h-[150%] object-cover"
              style={{
                transform: `translate(-${position.x}%, -${position.y}%)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
