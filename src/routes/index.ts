import { createFileRoute } from "@tanstack/react-router";
import { serveStaticPage } from "@/lib/static-site";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: ({ request }) => serveStaticPage(request, "/"),
    },
  },
  component: IndexStaticComponent,
});

function IndexStaticComponent() {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/index.html")
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
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
