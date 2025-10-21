import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { RepositoryProvider } from "@/lib/repository/RepositoryContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Git Visualizer",
  description: "Privacy-first, local-first Git commit graph visualizer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <RepositoryProvider>
            <AppShell>{children}</AppShell>
          </RepositoryProvider>
        </Providers>
      </body>
    </html>
  );
}
