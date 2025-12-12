import { useEffect, useRef, useState } from 'react';

// Helper: random integer between a..b (inclusive)
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/**
 * useBinAnimations
 * Schedules lighthearted animation ticks for eyes, lid, and wave.
 * - active: if true (e.g., current-week bin), run slightly more often.
 * Pauses when the tab is hidden.
 */
export default function useBinAnimations({ active = false } = {}) {
  const [eyesTick, setEyesTick] = useState(0);
  const [lidTick, setLidTick] = useState(0);
  const [waveTick, setWaveTick] = useState(0);

  const timers = useRef([]);

  useEffect(() => {
    const clearAll = () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
    let cancelled = false;

    const schedule = (cb, min, max, initialDelay = 0) => {
      const run = (delay) => {
        const timer = setTimeout(() => {
          if (cancelled || document.hidden) {
            run(1500);
            return;
          }
          cb();
          run(randInt(min, max));
        }, delay);
        timers.current.push(timer);
      };
      run(initialDelay);
    };

    const startAll = () => {
      const eyesMin = active ? 3000 : 5000;
      const eyesMax = active ? 9000 : 12000;
      schedule(
        () => setEyesTick((n) => n + 1),
        eyesMin,
        eyesMax,
        randInt(0, 3000),
      );
      schedule(() => setLidTick((n) => n + 1), active ? 2800 : 3800, active ? 5200 : 6600, 900);
      schedule(() => setWaveTick((n) => n + 1), 9000, 13000, 2500);
    };

    startAll();

    const handleVisibility = () => {
      if (document.hidden) {
        clearAll();
      } else if (timers.current.length === 0) {
        startAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      clearAll();
    };
  }, [active]);

  return { eyesTick, lidTick, waveTick };
}
