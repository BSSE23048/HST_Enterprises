import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { applyMetadata } from "./seo";
import "./index.css";
async function boot() {
  const root = document.getElementById("root")!;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const portal =
    path === "/portal" || path.startsWith("/portal/") || path === "/admin";
  applyMetadata(portal ? "portal" : path === "/" ? "home" : "missing");
  if (path === "/") {
    const { default: Site } = await import("./corporate/CorporateSite");
    const app = (
      <React.StrictMode>
        <Site />
      </React.StrictMode>
    );
    if (root.dataset.prerendered === "true") hydrateRoot(root, app);
    else createRoot(root).render(app);
  } else if (portal) {
    const { default: App } = await import("./App");
    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else
    createRoot(root).render(
      <main className="route-message">
        <h1>Page not found</h1>
        <p>This page may have moved.</p>
        <a href="/">Return to HST Enterprises</a>
      </main>,
    );
}
void boot().catch(() => {
  const root = document.getElementById("root")!;
  if (root.dataset.prerendered !== "true")
    root.textContent =
      "Unable to load the application. Please refresh or contact HST Enterprises.";
});
