import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for accessibility - must be first focusable element */}
      <a
        href="#main-content"
        className="skip-link"
        role="link"
      >
        Skip to main content
      </a>
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main
          id="main-content"
          className="flex-1 p-6"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
