export interface ChannelSummary {
  id: string;
  folder: string;
  delay_seconds: number;
  stop_time: string;
  playback_state: string;
  current_index: number;
  sequence_length: number;
  client_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelDetail extends ChannelSummary {
  has_previous: boolean;
  photo: {
    filename: string;
    date_taken: string | null;
    date_modified: string | null;
  } | null;
}

export interface FolderEntry {
  name: string;
  path: string;
}

export interface FolderBrowse {
  current: string;
  parent: string | null;
  folders: FolderEntry[];
  photo_count: number;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Unknown error");
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchChannels(): Promise<ChannelSummary[]> {
  const data = await apiFetch<{ channels: ChannelSummary[] }>("/api/channels");
  return data.channels;
}

export async function fetchChannel(id: string): Promise<ChannelDetail> {
  return apiFetch<ChannelDetail>(`/api/channels/${encodeURIComponent(id)}`);
}

export async function createChannel(id: string): Promise<ChannelDetail> {
  return apiFetch<ChannelDetail>("/api/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function fetchFolders(path: string = ""): Promise<FolderBrowse> {
  const params = path ? `?path=${encodeURIComponent(path)}` : "";
  return apiFetch<FolderBrowse>(`/api/folders${params}`);
}
