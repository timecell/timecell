import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-2 sm:py-1",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 sm:h-2 w-full grow overflow-hidden rounded-full bg-slate-700">
      <SliderPrimitive.Range className="absolute h-full bg-orange-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-[28px] w-[28px] sm:h-[18px] sm:w-[18px] rounded-full border-2 border-orange-500 bg-orange-500 shadow transition-all hover:scale-[1.3] hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] hover:bg-orange-400 active:scale-[1.1] active:shadow-[0_0_0_6px_rgba(249,115,22,0.3)] active:bg-orange-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(249,115,22,0.4)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
