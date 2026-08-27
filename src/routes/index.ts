import { createFileRoute } from "@tanstack/react-router";
import { serveStaticPage } from "@/lib/static-site";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: ({ request }) => serveStaticPage(request, "/"),
    },
  },
});
