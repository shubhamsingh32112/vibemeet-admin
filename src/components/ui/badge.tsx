import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-violet-500/20 text-violet-200',
        live: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 animate-pulse',
        warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
        danger: 'border-red-500/40 bg-red-500/10 text-red-200',
        outline: 'border-white/10 text-zinc-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
