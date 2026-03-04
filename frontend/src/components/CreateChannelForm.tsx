import { useEffect, useRef, useState } from "react";
import { createChannel, ApiError } from "../services/api";
import { FolderBrowser } from "./FolderBrowser";

const CHANNEL_ID_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

interface CreateChannelFormProps {
  onCreated: (channelId: string) => void;
  onCancel: () => void;
}

function validateName(name: string): string | null {
  if (name.length === 0) return null;
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 50) return "Name must be at most 50 characters";
  if (!CHANNEL_ID_RE.test(name))
    return "Use lowercase letters, numbers, and hyphens only (cannot start or end with hyphen)";
  return null;
}

export function CreateChannelForm({ onCreated, onCancel }: CreateChannelFormProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleNameChange = (value: string) => {
    const lowered = value.toLowerCase().trim();
    setName(lowered);
    setNameError(validateName(lowered));
    setSubmitError(null);
  };

  const isValid = name.length >= 2 && !nameError && selectedFolder !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !selectedFolder) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createChannel(name, selectedFolder);
      onCreated(name);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="w-full max-w-md rounded-lg bg-framory-surface p-6"
    >
      <h2 className="mb-4 text-lg font-bold text-framory-text">Add Channel</h2>

      {/* Channel name */}
      <label htmlFor="channel-name" className="mb-1 block text-sm text-framory-muted">
        Channel name
      </label>
      <input
        ref={nameInputRef}
        id="channel-name"
        type="text"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="e.g. family-photos"
        aria-label="Channel name"
        aria-invalid={nameError ? true : undefined}
        aria-describedby={nameError ? "name-error" : undefined}
        className="mb-1 w-full rounded bg-black/30 px-3 py-2 text-sm text-framory-text outline-none focus:ring-1 focus:ring-framory-primary"
        maxLength={50}
        autoComplete="off"
      />
      {nameError && (
        <p id="name-error" className="mb-3 text-xs text-framory-error" role="alert">
          {nameError}
        </p>
      )}
      {!nameError && <div className="mb-3" />}

      {/* Folder selection */}
      <label className="mb-1 block text-sm text-framory-muted">Photo Folder</label>
      {selectedFolder !== null && !showFolderBrowser ? (
        <div className="mb-4 flex items-center gap-2">
          <span className="flex-1 truncate rounded bg-black/30 px-3 py-2 text-sm text-framory-text">
            {selectedFolder} ({photoCount} photos)
          </span>
          <button
            type="button"
            onClick={() => setShowFolderBrowser(true)}
            className="rounded bg-framory-primary/20 px-3 py-2 text-sm text-framory-primary active:bg-framory-primary/40"
          >
            Change
          </button>
        </div>
      ) : showFolderBrowser ? (
        <div className="mb-4">
          <FolderBrowser
            initialPath={selectedFolder ?? ""}
            onSelect={(path, count) => {
              setSelectedFolder(path);
              setPhotoCount(count);
              setShowFolderBrowser(false);
              setSubmitError(null);
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowFolderBrowser(false)}
              className="rounded bg-framory-surface px-3 py-1.5 text-sm text-framory-muted active:opacity-80"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowFolderBrowser(true)}
          className="mb-4 w-full rounded bg-black/30 px-3 py-2 text-left text-sm text-framory-muted active:bg-framory-primary/20"
          aria-label="Browse folders"
        >
          Browse folders…
        </button>
      )}

      {/* Submit error */}
      {submitError && (
        <p className="mb-3 text-sm text-framory-error" role="alert">
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!isValid || submitting}
          aria-label="Create"
          className="flex-1 rounded-lg bg-framory-primary py-3 font-semibold text-white active:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating…
            </span>
          ) : (
            "Create"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="flex-1 rounded-lg bg-framory-surface py-3 font-semibold text-framory-muted ring-1 ring-framory-muted/30 active:opacity-80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
