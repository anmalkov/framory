import { useCallback, useEffect, useRef, useState } from "react";

interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef(document.documentElement);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = elementRef.current as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
    };

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        void el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        void el.webkitRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        void doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        void doc.webkitExitFullscreen();
      }
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
