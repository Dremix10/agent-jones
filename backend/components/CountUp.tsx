"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function CountUp({ 
  value, 
  duration = 600, 
  className = "",
  prefix = "",
  suffix = ""
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // If value hasn't changed, don't animate
    if (value === previousValueRef.current) return;

    const startValue = previousValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;

    // Animation function using requestAnimationFrame
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutCubic for smooth deceleration)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (difference * easeProgress);
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly on the target value
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        startTimeRef.current = undefined;
      }
    };

    // Start animation
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}
