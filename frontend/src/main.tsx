import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { applyMetadata, metadataForPath } from "./seo";
import { findCategory } from "./corporate/categories";
import { findCatalogueCategory } from './corporate/catalogueCategories';
import "./index.css";
function redirectLegacyCatalogue() {
  if (location.pathname !== '/' || !/^#catalogue(?:$|-)/.test(location.hash)) return false;
  location.replace('/products' + location.search + location.hash);
  return true;
}
window.addEventListener('hashchange', redirectLegacyCatalogue);
async function boot() {
  if (redirectLegacyCatalogue()) return;
  const root = document.getElementById("root")!;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const portal =
    path === "/portal" || path.startsWith("/portal/") || path === "/admin";
  applyMetadata(metadataForPath(path));
  const category = findCategory(path);
  const catalogueCategory = findCatalogueCategory(path);
  if (path === "/" || path === "/products" || catalogueCategory || category) {
    void import("./lib/publicAnalytics").then(module => module.initPublicAnalytics()).catch(() => {
      // Analytics must never prevent the public website from rendering.
    });
  }
  if (path === "/") {
    const { default: Site } = await import("./corporate/CorporateSite");
    const app = (
      <React.StrictMode>
        <Site />
      </React.StrictMode>
    );
    if (root.dataset.prerendered === "true") hydrateRoot(root, app);
    else createRoot(root).render(app);
  } else if (path === "/products" || catalogueCategory) {
    const { default: ProductsPage } = await import("./corporate/ProductsPage");
    const app = <React.StrictMode><ProductsPage category={catalogueCategory}/></React.StrictMode>;
    if (root.dataset.prerendered === "true") hydrateRoot(root, app);
    else createRoot(root).render(app);
  } else if (category) {
    const { default: CategoryPage } = await import("./corporate/CategoryPage");
    const app = <React.StrictMode><CategoryPage category={category}/></React.StrictMode>;
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
        <a href={path.startsWith("/products/category/") ? "/products" : "/"}>{path.startsWith("/products/category/") ? "Back to All Products" : "Return to HST Enterprises"}</a>
      </main>,
    );
}
void boot().catch(() => {
  const root = document.getElementById("root")!;
  if (root.dataset.prerendered !== "true")
    root.textContent =
      "Unable to load the application. Please refresh or contact HST Enterprises.";
});
