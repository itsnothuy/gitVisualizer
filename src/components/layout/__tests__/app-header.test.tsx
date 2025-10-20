import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "../app-header";

describe("AppHeader", () => {
  it("renders the header with correct role", () => {
    render(<AppHeader />);
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("displays the application title", () => {
    render(<AppHeader />);
    const title = screen.getByText("Git Visualizer");
    expect(title).toBeInTheDocument();
  });

  // Skip link test removed - now handled at app-shell level as first element

  it("has mode selector with correct modes", () => {
    render(<AppHeader />);
    const modeSelector = screen.getByRole("tablist", { name: /application mode selector/i });
    expect(modeSelector).toBeInTheDocument();

    // Check all three modes are present
    expect(screen.getByRole("tab", { name: /local repository mode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /sandbox mode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tutorial mode/i })).toBeInTheDocument();
  });
});
