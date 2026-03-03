import { useState } from "react";

interface PhotoViewerProps {
  url: string | null;
  seq: number;
  onTap: () => void;
}

export function PhotoViewer({ url, seq, onTap }: PhotoViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-framory-bg"
        onClick={onTap}
      >
        <p className="text-framory-muted text-lg">No photos available</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-framory-bg"
      onClick={onTap}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-framory-primary border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-framory-error">Failed to load photo</p>
        </div>
      )}
      <img
        key={seq}
        src={url}
        alt=""
        className="h-full w-full object-contain"
        onLoad={() => {
          setLoading(false);
          setError(false);
        }}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        draggable={false}
      />
    </div>
  );
}
