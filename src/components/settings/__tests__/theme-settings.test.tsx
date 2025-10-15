import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSettings } from "../theme-settings";

describe("ThemeSettings Component", () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  it("should render the settings card", () => {
    render(<ThemeSettings />);
    
    expect(screen.getByRole("heading", { name: /appearance/i })).toBeInTheDocument();
    expect(screen.getByText(/customize the graph visualization theme/i)).toBeInTheDocument();
  });

  it("should render LGB mode toggle button", () => {
    render(<ThemeSettings />);
    
    expect(screen.getByRole("heading", { name: /lgb mode/i })).toBeInTheDocument();
    expect(screen.getByText(/use the lgb color scheme/i)).toBeInTheDocument();
    
    const button = screen.getByRole("button", { name: /lgb mode/i });
    expect(button).toBeInTheDocument();
  });

  it("should show 'Off' button state initially", () => {
    render(<ThemeSettings />);
    
    const button = screen.getByRole("button", { name: /lgb mode/i });
    expect(button).toHaveTextContent("Off");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("should toggle to 'On' when clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSettings />);
    
    const button = screen.getByRole("button", { name: /lgb mode/i });
    
    await user.click(button);
    
    expect(button).toHaveTextContent("On");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("should toggle back to 'Off' when clicked twice", async () => {
    const user = userEvent.setup();
    render(<ThemeSettings />);
    
    const button = screen.getByRole("button", { name: /lgb mode/i });
    
    await user.click(button);
    await user.click(button);
    
    expect(button).toHaveTextContent("Off");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("should have accessible button label", () => {
    render(<ThemeSettings />);
    
    const button = screen.getByRole("button", { name: /lgb mode is off. click to toggle/i });
    expect(button).toBeInTheDocument();
  });

  it("should update accessible label when toggled", async () => {
    const user = userEvent.setup();
    render(<ThemeSettings />);
    
    let button = screen.getByRole("button", { name: /lgb mode is off/i });
    await user.click(button);
    
    button = screen.getByRole("button", { name: /lgb mode is on/i });
    expect(button).toBeInTheDocument();
  });
});
