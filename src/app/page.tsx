import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Git Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          A privacy-first, local-first Git commit graph visualizer
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Visualize your Git repository with an interactive commit graph
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Git Visualizer helps you understand your repository history with an accessible,
            interactive commit graph. All processing happens locally in your browser—no data
            is sent to external servers.
          </p>
          <div className="flex gap-4">
            <Button>Open Repository</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
