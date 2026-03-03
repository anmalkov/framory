import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  channelReducer,
  initialChannelState,
  type ChannelAction,
  type ChannelState,
} from "./channelReducer";

interface ChannelContextValue {
  state: ChannelState;
  dispatch: Dispatch<ChannelAction>;
}

const ChannelContext = createContext<ChannelContextValue | null>(null);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(channelReducer, initialChannelState);
  return (
    <ChannelContext.Provider value={{ state, dispatch }}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }
  return ctx;
}
