import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';

const Breadcrumb = ({
  ref,
  ...props
}: React.ComponentProps<'nav'> & {
  separator?: React.ReactNode;
}) => <nav ref={ref} aria-label="breadcrumb" {...props} />;

const BreadcrumbList = ({ className, ref, ...props }: React.ComponentProps<'ol'>) => (
  <ol
    ref={ref}
    className={cn(
      'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
      className,
    )}
    {...props}
  />
);

const BreadcrumbItem = ({ className, ref, ...props }: React.ComponentProps<'li'>) => (
  <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
);

const BreadcrumbLink = ({
  asChild,
  className,
  ref,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
}) => {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      ref={ref}
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  );
};

const BreadcrumbPage = ({ className, ref, ...props }: React.ComponentProps<'span'>) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('text-foreground font-normal', className)}
    {...props}
  />
);

const BreadcrumbSeparator = ({
  children,
  className,
  ref,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);

const BreadcrumbEllipsis = ({ className, ref, ...props }: React.ComponentProps<'span'>) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn('flex size-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More</span>
  </span>
);

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
