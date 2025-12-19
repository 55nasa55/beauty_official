'use client';

import { useState, useEffect } from 'react';
import { supabaseClientComponent } from '@/lib/supabaseClientComponent';
import { BannerCarousel } from './BannerCarousel';
import { Banner } from '@/lib/database.types';

interface DynamicBannerCarouselProps {
  initialBanners: Banner[];
}

export function DynamicBannerCarousel({ initialBanners }: DynamicBannerCarouselProps) {
  const supabase = supabaseClientComponent();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);

  useEffect(() => {
    const channel = supabase
      .channel('banners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners',
        },
        async () => {
          const { data } = await supabase
            .from('banners')
            .select('*')
            .eq('active', true)
            .order('sort_order');

          if (data) {
            setBanners(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return <BannerCarousel banners={banners} />;
}
