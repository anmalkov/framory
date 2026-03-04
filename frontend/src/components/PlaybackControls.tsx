import { IoPlayBackSharp, IoStop, IoPlayForwardSharp } from "react-icons/io5";
import { IoMdRefresh, IoMdPlay, IoMdSettings, IoMdHome } from "react-icons/io";

interface PlaybackControlsProps {
  playbackState: string;
  hasPrevious: boolean;
  onPlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSettings?: () => void;
  onHome?: () => void;
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
  onHome,
}: PlaybackControlsProps) {
  const isPlaying = playbackState === "playing";

  return (
    <div className="flex items-center justify-center gap-3">
      {onHome && (
        <ControlButton label="Navigate to home screen" icon={<IoMdHome size={20} />} onClick={onHome} />
      )}
      <ControlButton
        label="Previous"
        icon={<IoPlayBackSharp size={20} />}
        onClick={onPrev}
        disabled={!hasPrevious}
      />
      {isPlaying ? (
        <ControlButton label="Stop" icon={<IoStop size={24} />} onClick={onStop} large />
      ) : (
        <ControlButton label="Play" icon={<IoMdPlay size={24} />} onClick={onPlay} large />
      )}
      <ControlButton label="Next" icon={<IoPlayForwardSharp size={20} />} onClick={onNext} />
      <ControlButton label="Reset" icon={<IoMdRefresh size={20} />} onClick={onReset} />
      {onSettings && (
        <ControlButton label="Settings" icon={<IoMdSettings size={20} />} onClick={onSettings} />
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
  icon: React.ReactNode;
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
        large ? "h-16 w-16" : "h-12 w-12"
      }`}
    >
      {icon}
    </button>
  );
}
