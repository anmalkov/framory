import { useCallback, useEffect, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { ChannelPage } from "./pages/ChannelPage";
import {
  fetchChannel,
  createChannel,
  ApiError,
} from "./services/api";

type View =
  | { kind: "landing" }
  | { kind: "channel"; channelId: string }
  | { kind: "create-prompt"; channelId: string }
  | { kind: "loading"; channelId: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: "landing" });

  const navigateTo = useCallback((channelId: string) => {
    window.history.pushState(null, "", `/?channel=${encodeURIComponent(channelId)}`);
    setView({ kind: "loading", channelId });
  }, []);

  const goHome = useCallback(() => {
    window.history.pushState(null, "", "/");
    setView({ kind: "landing" });
  }, []);

  // Resolve channel on mount and navigation
  useEffect(() => {
    const resolve = async () => {
      const params = new URLSearchParams(window.location.search);
      const channelId = params.get("channel");

      if (!channelId) {
        setView({ kind: "landing" });
        return;
      }

      setView({ kind: "loading", channelId });
      try {
        await fetchChannel(channelId);
        setView({ kind: "channel", channelId });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setView({ kind: "create-prompt", channelId });
        } else {
          setView({ kind: "landing" });
        }
      }
    };

    void resolve();

    const handlePopState = () => void resolve();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle navigation from loading state
  useEffect(() => {
    if (view.kind !== "loading") return;
    const resolve = async () => {
      try {
        await fetchChannel(view.channelId);
        setView({ kind: "channel", channelId: view.channelId });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setView({ kind: "create-prompt", channelId: view.channelId });
        } else {
          setView({ kind: "landing" });
        }
      }
    };
    void resolve();
  }, [view]);

  const handleCreate = async (channelId: string) => {
    try {
      await createChannel(channelId);
      setView({ kind: "channel", channelId });
    } catch {
      setView({ kind: "landing" });
    }
  };

  switch (view.kind) {
    case "landing":
      return <LandingPage onSelectChannel={navigateTo} />;

    case "loading":
      return (
        <div className="flex h-full items-center justify-center bg-framory-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-framory-primary border-t-transparent" />
        </div>
      );

    case "create-prompt":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 bg-framory-bg p-6">
          <p className="text-center text-lg text-framory-text">
            Channel <strong>"{view.channelId}"</strong> does not exist.
          </p>
          <p className="text-framory-muted">Create it?</p>
          <div className="flex gap-4">
            <button
              onClick={() => void handleCreate(view.channelId)}
              className="rounded-lg bg-framory-primary px-6 py-3 font-semibold text-white active:opacity-80"
            >
              Create
            </button>
            <button
              onClick={goHome}
              className="rounded-lg bg-framory-surface px-6 py-3 font-semibold text-framory-text active:opacity-80"
            >
              Cancel
            </button>
          </div>
        </div>
      );

    case "channel":
      return <ChannelPage channelId={view.channelId} />;
  }
}
