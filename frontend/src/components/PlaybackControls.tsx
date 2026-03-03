interface PlaybackControlsProps {
  playbackState: string;
  hasPrevious: boolean;
  onPlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSettings?: () => void;
}

export function PlaybackControls({
  playbackState,
  hasPrevious,
  onPlay,
  onStop,
  onNext,
  onPrev,
  onReset,
  onSettings,
}: PlaybackControlsProps) {
  const isPlaying = playbackState === "playing";

  return (
    <div className="flex items-center justify-center gap-3">
      <ControlButton
        label="Previous"
        icon="⏮"
        onClick={onPrev}
        disabled={!hasPrevious}
      />
      {isPlaying ? (
        <ControlButton label="Stop" icon="⏹" onClick={onStop} large />
      ) : (
        <ControlButton label="Play" icon="▶" onClick={onPlay} large />
      )}
      <ControlButton label="Next" icon="⏭" onClick={onNext} />
      <ControlButton label="Reset" icon="↺" onClick={onReset} />
      {onSettings && (
        <ControlButton label="Settings" icon="⚙" onClick={onSettings} />
      )}
    </div>
  );
}

function ControlButton({
  label,
  icon,
  onClick,
  disabled,
  large,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  large?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-disabled={disabled}
      className={`flex items-center justify-center rounded-full bg-framory-surface/80 backdrop-blur transition-colors active:bg-framory-primary/40 disabled:opacity-30 disabled:cursor-not-allowed ${
        large ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg"
      }`}
    >
      {icon}
    </button>
  );
}
