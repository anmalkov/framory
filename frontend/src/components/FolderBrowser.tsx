import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFolders, type FolderEntry } from "../services/api";

interface FolderBrowserProps {
  initialPath?: string;
  onSelect: (path: string, photoCount: number) => void;
}

export function FolderBrowser({ initialPath = "", onSelect }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadFolders = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFolders(path);
      setFolders(data.folders);
      setPhotoCount(data.photo_count);
      setParentPath(data.parent);
      setCurrentPath(path);
    } catch {
      setError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders(initialPath);
  }, [initialPath, loadFolders]);

  useEffect(() => {
    if (!loading && listRef.current) {
      listRef.current.focus();
    }
  }, [loading, currentPath]);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  if (loading) {
    return (
      <div className="rounded bg-black/30 p-3">
        <div className="py-4 text-center text-sm text-framory-muted">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-black/30 p-3">
        <p className="py-2 text-center text-sm text-framory-error">{error}</p>
        <div className="flex justify-center">
          <button
            onClick={() => void loadFolders(currentPath)}
            className="rounded bg-framory-primary/20 px-3 py-1.5 text-sm text-framory-primary active:bg-framory-primary/40"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded bg-black/30 p-3" role="region" aria-label="Folder browser">
      <div className="mb-2 flex items-center gap-2 text-sm">
        {parentPath !== null && (
          <button
            onClick={() => void loadFolders(parentPath ?? "")}
            onKeyDown={(e) => handleKeyDown(e, () => void loadFolders(parentPath ?? ""))}
            className="text-framory-primary active:opacity-80"
            aria-label="Navigate to parent folder"
          >
            ← Back
          </button>
        )}
        <span className="flex-1 truncate text-framory-muted">
          /{currentPath || ""}
        </span>
        <span className="text-xs text-framory-muted">{photoCount} photos</span>
      </div>

      <div ref={listRef} className="max-h-40 overflow-y-auto" tabIndex={-1} role="list" aria-label="Folder list">
        {folders.map((f) => (
          <button
            key={f.path}
            onClick={() => void loadFolders(f.path)}
            onKeyDown={(e) => handleKeyDown(e, () => void loadFolders(f.path))}
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-framory-text active:bg-framory-primary/20 focus:bg-framory-primary/10 focus:outline-none"
            role="listitem"
            aria-label={`Folder: ${f.name}`}
          >
            📁 {f.name}
          </button>
        ))}
        {folders.length === 0 && (
          <p className="py-2 text-center text-xs text-framory-muted">
            No subfolders
          </p>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <button
          onClick={() => onSelect(currentPath, photoCount)}
          onKeyDown={(e) => handleKeyDown(e, () => onSelect(currentPath, photoCount))}
          className="rounded bg-framory-primary px-3 py-1.5 text-sm text-white active:opacity-80"
          aria-label="Select this folder"
        >
          Select This Folder
        </button>
      </div>
    </div>
  );
}
