import { createFileRoute } from "@tanstack/react-router";
import { serveStaticPage } from "@/lib/static-site";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$")({
  server: {
    handlers: {
      GET: ({ request }) => serveStaticPage(request, new URL(request.url).pathname),
    },
  },
  component: StaticPageComponent,
});

function StaticPageComponent() {
  const [html, setHtml] = useState<string>("");
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = pathname.endsWith("/") ? `${pathname}index.html` : `${pathname}/index.html`;
    fetch(target)
      .then((res) => {
        if (!res.ok) return fetch(pathname);
        return res;
      })
      .then((res) => res.text())
      .then((content) => {
        if (content.includes("<!DOCTYPE html>") || content.includes("<html")) {
          document.open();
          document.write(content);
          document.close();
        } else {
          setHtml(content);
        }
      })
      .catch(console.error);
  }, [pathname]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
