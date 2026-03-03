import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ProgressBar } from "../../src/components/ProgressBar";

describe("ProgressBar", () => {
  it("renders when isPlaying is true", () => {
    render(<ProgressBar durationSeconds={30} isPlaying={true} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
  });

  it("does not render when isPlaying is false", () => {
    render(<ProgressBar durationSeconds={30} isPlaying={false} />);
    const bar = screen.queryByRole("progressbar");
    expect(bar).not.toBeInTheDocument();
  });

  it("applies correct transition duration", () => {
    render(<ProgressBar durationSeconds={45} isPlaying={true} />);
    const bar = screen.getByRole("progressbar");
    // Initially width is 0% with no transition (before rAF triggers)
    expect(bar.style.width).toBe("0%");
    expect(bar.style.transition).toBe("none");
  });

  it("uses the design token class", () => {
    render(<ProgressBar durationSeconds={30} isPlaying={true} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("bg-framory-progress");
  });

  it("is fixed at the bottom of the viewport", () => {
    render(<ProgressBar durationSeconds={30} isPlaying={true} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("fixed", "bottom-0", "left-0");
  });

  it("has correct height", () => {
    render(<ProgressBar durationSeconds={30} isPlaying={true} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("h-[2px]");
  });
});
