import { useState } from "react";
import { FolderBrowser } from "./FolderBrowser";

interface SettingsPanelProps {
  currentFolder: string;
  currentDelay: number;
  currentStopTime: string;
  currentShowProgressBar: boolean;
  onSave: (settings: {
    folder?: string;
    delay_seconds?: number;
    stop_time?: string;
    show_progress_bar?: boolean;
  }) => void;
  onClose: () => void;
}

export function SettingsPanel({
  currentFolder,
  currentDelay,
  currentStopTime,
  currentShowProgressBar,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [folder, setFolder] = useState(currentFolder);
  const [delay, setDelay] = useState(currentDelay);
  const [stopTime, setStopTime] = useState(currentStopTime);
  const [showProgressBar, setShowProgressBar] = useState(currentShowProgressBar);
  const [browsing, setBrowsing] = useState(false);

  const handleSave = () => {
    const settings: { folder?: string; delay_seconds?: number; stop_time?: string; show_progress_bar?: boolean } = {};
    if (folder !== currentFolder) settings.folder = folder;
    if (delay !== currentDelay) settings.delay_seconds = delay;
    if (stopTime !== currentStopTime) settings.stop_time = stopTime;
    if (showProgressBar !== currentShowProgressBar) settings.show_progress_bar = showProgressBar;
    if (Object.keys(settings).length > 0) {
      onSave(settings);
    }
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-framory-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-framory-text">
          Channel Settings
        </h2>

        {/* Folder */}
        <label className="mb-1 block text-sm text-framory-muted">
          Photo Folder
        </label>
        {!browsing ? (
          <div className="mb-4 flex items-center gap-2">
            <span className="flex-1 truncate rounded bg-black/30 px-3 py-2 text-sm text-framory-text">
              {folder || "(none)"}
            </span>
            <button
              onClick={() => setBrowsing(true)}
              className="rounded bg-framory-primary/20 px-3 py-2 text-sm text-framory-primary active:bg-framory-primary/40"
            >
              Browse
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <FolderBrowser
              initialPath={folder}
              onSelect={(path) => {
                setFolder(path);
                setBrowsing(false);
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setBrowsing(false)}
                className="rounded bg-framory-surface px-3 py-1.5 text-sm text-framory-muted active:opacity-80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delay */}
        <label className="mb-1 block text-sm text-framory-muted">
          Slideshow Delay (seconds)
        </label>
        <input
          type="number"
          min={5}
          value={delay}
          onChange={(e) => setDelay(Math.max(5, parseInt(e.target.value) || 5))}
          className="mb-4 w-full rounded bg-black/30 px-3 py-2 text-sm text-framory-text outline-none focus:ring-1 focus:ring-framory-primary"
        />

        {/* Stop Time */}
        <label className="mb-1 block text-sm text-framory-muted">
          Daily Stop Time
        </label>
        <input
          type="time"
          value={stopTime}
          onChange={(e) => setStopTime(e.target.value)}
          className="mb-4 w-full rounded bg-black/30 px-3 py-2 text-sm text-framory-text outline-none focus:ring-1 focus:ring-framory-primary"
        />

        {/* Show Progress Bar */}
        <label className="mb-4 flex items-center justify-between">
          <span className="text-sm text-framory-muted">Show Progress Bar</span>
          <button
            type="button"
            role="switch"
            aria-checked={showProgressBar}
            onClick={() => setShowProgressBar(!showProgressBar)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showProgressBar ? "bg-framory-primary" : "bg-framory-muted/40"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                showProgressBar ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-framory-primary py-3 font-semibold text-white active:opacity-80"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-framory-surface py-3 font-semibold text-framory-muted ring-1 ring-framory-muted/30 active:opacity-80"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
