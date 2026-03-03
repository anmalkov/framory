import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  durationSeconds: number;
  isPlaying: boolean;
}

export function ProgressBar({ durationSeconds, isPlaying }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setIsAnimating(false);
      return;
    }

    // Start at 0%, then trigger animation to 100% on next frame
    setIsAnimating(false);
    const frame = requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isPlaying, durationSeconds]);

  if (!isPlaying) {
    return null;
  }

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-valuenow={isAnimating ? 100 : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed bottom-0 left-0 z-10 h-[2px] bg-framory-progress"
      style={{
        width: isAnimating ? "100%" : "0%",
        transition: isAnimating
          ? `width ${durationSeconds}s linear`
          : "none",
      }}
    />
  );
}
