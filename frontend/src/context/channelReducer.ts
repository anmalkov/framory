export type PlaybackState =
  | "playing"
  | "stopped_manual"
  | "stopped_scheduled"
  | "stopped_no_clients";

export type ConnectionStatus = "connected" | "reconnecting" | "offline";

export interface PhotoInfo {
  url: string;
  filename: string;
  date_taken: string | null;
  date_modified: string | null;
}

export interface ChannelConfig {
  folder: string;
  delay_seconds: number;
  stop_time: string;
  show_progress_bar: boolean;
}

export interface ChannelState {
  channelId: string;
  playbackState: PlaybackState;
  photo: PhotoInfo | null;
  currentIndex: number;
  sequenceLength: number;
  hasPrevious: boolean;
  config: ChannelConfig;
  connectionStatus: ConnectionStatus;
  seq: number;
  error: string | null;
}

export type ChannelAction =
  | {
      type: "SET_STATE";
      payload: {
        channel_id: string;
        playback_state: PlaybackState;
        photo: PhotoInfo | null;
        current_index: number;
        sequence_length: number;
        has_previous: boolean;
        config: ChannelConfig;
        seq: number;
      };
    }
  | { type: "SET_CONNECTION_STATUS"; payload: ConnectionStatus }
  | { type: "SET_ERROR"; payload: string };

export const initialChannelState: ChannelState = {
  channelId: "",
  playbackState: "stopped_manual",
  photo: null,
  currentIndex: 0,
  sequenceLength: 0,
  hasPrevious: false,
  config: { folder: "", delay_seconds: 60, stop_time: "00:00", show_progress_bar: true },
  connectionStatus: "offline",
  seq: 0,
  error: null,
};

export function channelReducer(
  state: ChannelState,
  action: ChannelAction,
): ChannelState {
  switch (action.type) {
    case "SET_STATE":
      return {
        ...state,
        channelId: action.payload.channel_id,
        playbackState: action.payload.playback_state,
        photo: action.payload.photo,
        currentIndex: action.payload.current_index,
        sequenceLength: action.payload.sequence_length,
        hasPrevious: action.payload.has_previous,
        config: action.payload.config,
        seq: action.payload.seq,
        error: null,
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
