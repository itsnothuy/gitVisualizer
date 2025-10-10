import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("provides skip to main content link", () => {
    render(<AppHeader />);
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("has navigation landmark with label", () => {
    render(<AppHeader />);
    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });
});
