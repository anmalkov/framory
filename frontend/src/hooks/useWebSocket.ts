import { useCallback, useEffect, useRef } from "react";
import type { ChannelAction } from "../context/channelReducer";

type CommandAction = "play" | "stop" | "next" | "prev" | "reset";

interface ConfigureSettings {
  folder?: string;
  delay_seconds?: number;
  stop_time?: string;
}

interface UseWebSocketReturn {
  sendCommand: (action: CommandAction) => void;
  sendConfigure: (settings: ConfigureSettings) => void;
  sendPing: () => void;
}

export function useWebSocket(
  channelId: string | null,
  dispatch: React.Dispatch<ChannelAction>,
): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!channelId) return;

    dispatch({ type: "SET_CONNECTION_STATUS", payload: "reconnecting" });

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/${channelId}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelay.current = 1000;
      dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "state") {
          dispatch({ type: "SET_STATE", payload: data });
        } else if (data.type === "error") {
          dispatch({ type: "SET_ERROR", payload: data.message });
        }
        // pong messages are silently consumed
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      dispatch({ type: "SET_CONNECTION_STATUS", payload: "reconnecting" });
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [channelId, dispatch]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      connect();
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 8000);
    }, reconnectDelay.current);
  }, [connect]);

  useEffect(() => {
    connect();

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      ) {
        reconnectDelay.current = 1000;
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendCommand = useCallback(
    (action: CommandAction) => send({ type: "command", action }),
    [send],
  );

  const sendConfigure = useCallback(
    (settings: ConfigureSettings) => send({ type: "configure", settings }),
    [send],
  );

  const sendPing = useCallback(() => send({ type: "ping" }), [send]);

  return { sendCommand, sendConfigure, sendPing };
}
