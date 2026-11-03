import { useState, useEffect } from 'react';

interface CounterOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function useCounterAnimation(
  targetValue: number,
  initialValue: number = 0,
  options: CounterOptions = {}
): string {
  const { duration = 1200, decimals = 0, prefix = '', suffix = '', delay = 0 } = options;
  const [current, setCurrent] = useState(initialValue);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const startAnimation = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = initialValue + (targetValue - initialValue) * eased;
      setCurrent(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(startAnimation);
      } else {
        setCurrent(targetValue);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(startAnimation);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, initialValue, duration, delay]);

  const formattedNum = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString();
  return `${prefix}${formattedNum}${suffix}`;
}

export function useNumberTween(target: number, duration: number = 1000): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame: number;

    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setVal(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return val;
}

