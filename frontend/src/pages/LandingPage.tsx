import { useCallback, useEffect, useState } from "react";
import { fetchChannels, type ChannelSummary } from "../services/api";

interface LandingPageProps {
  onSelectChannel: (id: string) => void;
  onCreateChannel?: (id: string) => void;
}

export function LandingPage({ onSelectChannel }: LandingPageProps) {
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchChannels();
      setChannels(list);
      setError(null);
    } catch {
      setError("Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stateLabel = (state: string) => {
    switch (state) {
      case "playing":
        return "▶ Playing";
      case "stopped_manual":
        return "⏹ Stopped";
      case "stopped_scheduled":
        return "⏹ Stopped (scheduled)";
      case "stopped_no_clients":
        return "⏹ Stopped (no clients)";
      default:
        return state;
    }
  };

  const stateColor = (state: string) => {
    return state === "playing" ? "text-framory-success" : "text-framory-muted";
  };

  return (
    <div className="flex h-full flex-col items-center bg-framory-bg p-6">
      <h1 className="mb-8 text-3xl font-bold text-framory-text">Framory</h1>

      {loading && (
        <div className="space-y-3 w-full max-w-md">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-framory-surface"
            />
          ))}
        </div>
      )}

      {error && <p className="text-framory-error">{error}</p>}

      {!loading && !error && channels.length === 0 && (
        <p className="text-framory-muted">
          No channels yet. Navigate to{" "}
          <code className="text-framory-primary">/?channel=my-channel</code> to
          create one.
        </p>
      )}

      {!loading && channels.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className="flex w-full items-center justify-between rounded-lg bg-framory-surface p-4 text-left transition-colors active:bg-framory-primary/20"
            >
              <div>
                <p className="text-lg font-semibold text-framory-text">
                  {ch.id}
                </p>
                <p className="text-sm text-framory-muted">
                  {ch.folder || "No folder configured"}
                </p>
                <p className={`text-sm ${stateColor(ch.playback_state)}`}>
                  {stateLabel(ch.playback_state)}
                </p>
              </div>
              <div className="text-right text-sm text-framory-muted">
                <p>{ch.sequence_length} photos</p>
                <p>
                  {ch.client_count} client{ch.client_count !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
