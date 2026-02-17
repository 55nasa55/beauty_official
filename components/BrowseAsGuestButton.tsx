'use client';

import { useRouter } from 'next/navigation';

export function BrowseAsGuestButton({ className }: { className?: string }) {
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
      Browse as Guest
    </button>
  );
}
