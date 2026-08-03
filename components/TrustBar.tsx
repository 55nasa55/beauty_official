'use client';

import { useState, useEffect, useRef } from 'react';
import { Truck, CalendarPlus, Tags } from 'lucide-react';

export function TrustBar() {
  const [memberCount, setMemberCount] = useState(10400);
  const targetRef = useRef(10482);
  const rafRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setMemberCount((prev) => {
        if (prev >= targetRef.current) {
          return targetRef.current;
        }
        const next = Math.min(prev + 3, targetRef.current);
        rafRef.current = requestAnimationFrame(animate);
        return next;
      });
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="bg-soft-rose py-3 px-[5%] flex flex-col md:flex-row justify-between items-center gap-3 text-trust-bar">
      <span className="flex items-center gap-2">
        <span className="live-dot" />
        <span>{memberCount.toLocaleString()}</span> members
      </span>
      <span className="flex items-center gap-1.5">
        <Truck className="w-4 h-4" />
        Free shipping at $55 for members, $75 for all
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarPlus className="w-4 h-4" />
        New arrivals weekly
      </span>
      <span className="flex items-center gap-1.5">
        <Tags className="w-4 h-4" />
        Exclusive member pricing
      </span>
    </div>
  );
}
