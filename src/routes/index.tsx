import { createFileRoute } from "@tanstack/react-router";
import { serveStaticPage } from "@/lib/static-site";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: ({ request }) => serveStaticPage(request, "/"),
    },
  },
  component: IndexStaticComponent,
});

/**
 * Client-side fallback for the "/" route.
 *
 * On a normal first request the server GET handler returns the complete static
 * HTML page directly — the browser renders it as a plain document and this
 * React component never mounts.
 *
 * This component only executes during client-side SPA navigation (e.g. if
 * TanStack Router intercepts an <a> click). In that case we force a full page
 * reload so the server handler serves the real static HTML with all Framer
 * scripts intact.  No document.write() — that kills ES-module execution.
 */
function IndexStaticComponent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  // Brief loading state visible only during the instant before reload fires
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      Loading…
    </div>
  );
}
