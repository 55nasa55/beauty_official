import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // CosClub design-system variants
        savings:
          'rounded-savings bg-savings-red text-white text-xs font-bold border-transparent px-2.5 py-0.5',
        newBadge:
          'rounded-new-badge bg-blush-pink text-charcoal text-[11px] font-bold border-transparent uppercase tracking-[0.5px] px-2 py-0.5',
        // shadcn/ui legacy variants (kept for existing component compatibility)
        default:
          'rounded-full border-transparent bg-primary text-primary-foreground hover:bg-primary/80 text-xs font-semibold',
        secondary:
          'rounded-full border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold',
        destructive:
          'rounded-full border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 text-xs font-semibold',
        outline: 'rounded-full text-foreground text-xs font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
