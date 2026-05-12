import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ButtonProps, buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ref, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    ref={ref}
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);

const PaginationContent = ({ className, ref, ...props }: React.ComponentProps<'ul'>) => (
  <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
);

const PaginationItem = ({ className, ref, ...props }: React.ComponentProps<'li'>) => (
  <li ref={ref} className={cn('', className)} {...props} />
);

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ref,
  ...props
}: PaginationLinkProps) => (
  <a
    ref={ref}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className,
    )}
    {...props}
  />
);

const PaginationPrevious = ({
  className,
  size = 'default',
  ref,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to previous page"
    size={size}
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="size-4" />
    <span>Previous</span>
  </PaginationLink>
);

const PaginationNext = ({
  className,
  size = 'default',
  ref,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to next page"
    size={size}
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="size-4" />
  </PaginationLink>
);

const PaginationEllipsis = ({ className, ref, ...props }: React.ComponentProps<'span'>) => (
  <span
    ref={ref}
    aria-hidden
    className={cn('flex size-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
