'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) => {
  const id = React.useId();
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {(Array.isArray(props.value)
        ? props.value
        : Array.isArray(props.defaultValue)
          ? props.defaultValue
          : [0]
      ).map((_, i) => (
        <SliderPrimitive.Thumb
          key={`${id}-${i}`}
          className="border-primary bg-background ring-offset-background focus-visible:ring-ring block size-5 rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
};

export { Slider };
