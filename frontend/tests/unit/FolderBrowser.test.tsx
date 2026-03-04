import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { FolderBrowser } from "../../src/components/FolderBrowser";

vi.mock("../../src/services/api", () => ({
  fetchFolders: vi.fn(),
}));

import { fetchFolders } from "../../src/services/api";

const mockFetchFolders = vi.mocked(fetchFolders);

describe("FolderBrowser", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockFetchFolders.mockReturnValue(new Promise(() => {})); // never resolves
    render(<FolderBrowser onSelect={mockOnSelect} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows folders after loading", async () => {
    mockFetchFolders.mockResolvedValueOnce({
      current: "",
      parent: null,
      folders: [
        { name: "family", path: "family" },
        { name: "vacation", path: "vacation" },
      ],
      photo_count: 5,
    });

    render(<FolderBrowser onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("📁 family")).toBeInTheDocument();
      expect(screen.getByText("📁 vacation")).toBeInTheDocument();
    });
    expect(screen.getByText("5 photos")).toBeInTheDocument();
  });

  it("navigates into subfolder on click", async () => {
    const user = userEvent.setup();
    mockFetchFolders
      .mockResolvedValueOnce({
        current: "",
        parent: null,
        folders: [{ name: "family", path: "family" }],
        photo_count: 0,
      })
      .mockResolvedValueOnce({
        current: "family",
        parent: "",
        folders: [{ name: "2024", path: "family/2024" }],
        photo_count: 42,
      });

    render(<FolderBrowser onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("📁 family")).toBeInTheDocument();
    });

    await user.click(screen.getByText("📁 family"));

    await waitFor(() => {
      expect(screen.getByText("📁 2024")).toBeInTheDocument();
      expect(screen.getByText("42 photos")).toBeInTheDocument();
    });
  });

  it("navigates back to parent", async () => {
    const user = userEvent.setup();
    mockFetchFolders.mockResolvedValueOnce({
      current: "family",
      parent: "",
      folders: [{ name: "2024", path: "family/2024" }],
      photo_count: 10,
    });

    render(<FolderBrowser initialPath="family" onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Navigate to parent folder")).toBeInTheDocument();
    });

    mockFetchFolders.mockResolvedValueOnce({
      current: "",
      parent: null,
      folders: [{ name: "family", path: "family" }],
      photo_count: 0,
    });

    await user.click(screen.getByLabelText("Navigate to parent folder"));

    await waitFor(() => {
      expect(screen.getByText("📁 family")).toBeInTheDocument();
    });
  });

  it("calls onSelect when folder is selected", async () => {
    const user = userEvent.setup();
    mockFetchFolders.mockResolvedValueOnce({
      current: "family",
      parent: "",
      folders: [],
      photo_count: 42,
    });

    render(<FolderBrowser initialPath="family" onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Select this folder")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Select this folder"));
    expect(mockOnSelect).toHaveBeenCalledWith("family", 42);
  });

  it("shows empty state when no folders", async () => {
    mockFetchFolders.mockResolvedValueOnce({
      current: "",
      parent: null,
      folders: [],
      photo_count: 0,
    });

    render(<FolderBrowser onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("No subfolders")).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    mockFetchFolders.mockRejectedValueOnce(new Error("Network error"));

    render(<FolderBrowser onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load folders")).toBeInTheDocument();
    });
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});
