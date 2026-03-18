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
      className="relative cursor-zoom-in w-full h-full overflow-visible"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />

      {showZoom && (
        <div className="absolute left-full ml-6 top-0 w-[500px] h-[500px] overflow-hidden rounded-xl shadow-2xl bg-white pointer-events-none hidden md:block border border-gray-200">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "200%",
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      )}
    </div>
  );
}
