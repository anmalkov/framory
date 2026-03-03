import type { ConnectionStatus } from "../context/channelReducer";

interface StatusBarProps {
  channelId: string;
  folder: string;
  delaySeconds: number;
  stopTime: string;
  playbackState: string;
  connectionStatus: ConnectionStatus;
  currentIndex: number;
  sequenceLength: number;
}

export function StatusBar({
  channelId,
  folder,
  delaySeconds,
  stopTime,
  playbackState,
  connectionStatus,
  currentIndex,
  sequenceLength,
}: StatusBarProps) {
  const stateDisplay = () => {
    if (connectionStatus === "reconnecting") return { label: "Reconnecting…", color: "text-framory-warning" };
    if (connectionStatus === "offline") return { label: "Offline", color: "text-framory-error" };
    switch (playbackState) {
      case "playing": return { label: "Playing", color: "text-framory-success" };
      case "stopped_manual": return { label: "Stopped", color: "text-framory-muted" };
      case "stopped_scheduled": return { label: "Stopped (scheduled)", color: "text-framory-muted" };
      case "stopped_no_clients": return { label: "Stopped", color: "text-framory-muted" };
      default: return { label: playbackState, color: "text-framory-muted" };
    }
  };

  const { label, color } = stateDisplay();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-framory-muted">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-framory-text">{channelId}</span>
        <span className={`font-medium ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {folder && <span>{folder}</span>}
        <span>{delaySeconds}s</span>
        <span>Stop: {stopTime}</span>
        {sequenceLength > 0 && (
          <span>{currentIndex + 1}/{sequenceLength}</span>
        )}
      </div>
    </div>
  );
}
