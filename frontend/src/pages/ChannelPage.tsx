import { useCallback, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { PhotoViewer } from "../components/PhotoViewer";
import { PlaybackControls } from "../components/PlaybackControls";
import { PhotoInfo } from "../components/PhotoInfo";
import { StatusBar } from "../components/StatusBar";
import { SettingsPanel } from "../components/SettingsPanel";
import { ProgressBar } from "../components/ProgressBar";
import { useChannel } from "../context/ChannelContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { useFullscreen } from "../hooks/useFullscreen";

interface ChannelPageProps {
  channelId: string;
  onHome?: () => void;
}

export function ChannelPage({ channelId, onHome }: ChannelPageProps) {
  const { state, dispatch } = useChannel();
  const { sendCommand, sendConfigure } = useWebSocket(channelId, dispatch);
  const { toggleFullscreen } = useFullscreen();
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleTap = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => sendCommand("next"),
    onSwipedRight: () => {
      if (state.hasPrevious) sendCommand("prev");
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  const isReconnecting = state.connectionStatus === "reconnecting";
  const isOffline = state.connectionStatus === "offline";

  return (
    <div className="relative h-full w-full select-none" {...swipeHandlers}>
      <PhotoViewer
        url={state.photo?.url ?? null}
        seq={state.seq}
        onTap={handleTap}
      />

      {/* Reconnecting overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-framory-warning border-t-transparent" />
            <p className="text-framory-warning">Reconnecting…</p>
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {isOffline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-framory-error/90 px-4 py-2 text-sm text-white">
          Offline
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <div
          className="absolute inset-0 flex flex-col justify-between bg-black/40 p-4"
          onClick={handleTap}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <StatusBar
              channelId={state.channelId || channelId}
              folder={state.config.folder}
              delaySeconds={state.config.delay_seconds}
              stopTime={state.config.stop_time}
              playbackState={state.playbackState}
              connectionStatus={state.connectionStatus}
              currentIndex={state.currentIndex}
              sequenceLength={state.sequenceLength}
            />
          </div>

          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <PhotoInfo
              filename={state.photo?.filename ?? null}
              dateTaken={state.photo?.date_taken ?? null}
              dateModified={state.photo?.date_modified ?? null}
            />
            <PlaybackControls
              playbackState={state.playbackState}
              hasPrevious={state.hasPrevious}
              onPlay={() => { sendCommand("play"); setShowControls(false); }}
              onStop={() => sendCommand("stop")}
              onNext={() => sendCommand("next")}
              onPrev={() => sendCommand("prev")}
              onReset={() => sendCommand("reset")}
              onSettings={() => setShowSettings(!showSettings)}
              onHome={onHome}
            />
            <button
              onClick={toggleFullscreen}
              className="text-xs text-framory-muted active:text-framory-text"
            >
              Toggle Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          currentFolder={state.config.folder}
          currentDelay={state.config.delay_seconds}
          currentStopTime={state.config.stop_time}
          currentShowProgressBar={state.config.show_progress_bar}
          onSave={sendConfigure}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Progress bar */}
      {state.config.show_progress_bar && state.photo && (
        <ProgressBar
          key={`${state.seq}-${state.config.delay_seconds}`}
          durationSeconds={state.config.delay_seconds}
          isPlaying={state.playbackState === "playing"}
        />
      )}

      {/* Error message */}
      {state.error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-framory-error/90 px-4 py-2 text-sm text-white">
          {state.error}
        </div>
      )}
    </div>
  );
}
