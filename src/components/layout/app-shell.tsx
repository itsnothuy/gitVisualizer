import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
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
