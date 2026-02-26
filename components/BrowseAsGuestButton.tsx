'use client';

import { useRouter } from 'next/navigation';

export function BrowseAsGuestButton({ className, label = "Browse as Guest" }: { className?: string; label?: string }) {
  const router = useRouter();

  const handleClick = () => {
    document.cookie = "cc_guest_bypass=true; path=/; max-age=604800";
    router.push('/');
  };

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {label}
    </button>
  );
}
