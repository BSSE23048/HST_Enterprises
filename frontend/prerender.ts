import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createServer, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
export function prerender(): Plugin {
  let root = "",
    out = "";
  return {
    name: "hst-static-pages",
    apply: "build",
    configResolved(c) {
      root = c.root;
      out = path.resolve(root, c.build.outDir);
    },
    async closeBundle() {
      const server = await createServer({
        root,
        configFile: false,
        plugins: [react()],
        server: { middlewareMode: true },
        appType: "custom",
      });
      try {
        const { render } = await server.ssrLoadModule(
          "/src/prerender-entry.tsx",
        );
        const { pages, schema, siteUrl } =
          await server.ssrLoadModule("/src/seo.ts");
        const base = await fs.readFile(path.join(out, "index.html"), "utf8");
        const json = JSON.stringify(schema).replaceAll("<", "\\u003c");
        const files = await fs.readdir(path.join(out, "assets"));
        const css = files.find((f) => /^CorporateSite-.*\.css$/.test(f));
        if (!css) throw Error("Missing corporate stylesheet");
        for (const kind of ["home", "portal", "missing"]) {
          const p = pages[kind];
          const meta = `<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><meta name="robots" content="${p.robots}"><link rel="canonical" href="${siteUrl}${p.path}"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${siteUrl}${p.path}"><meta property="og:type" content="website"><meta property="og:site_name" content="HST Enterprises"><meta property="og:image" content="${siteUrl}/company/industry.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.title)}"><meta name="twitter:description" content="${esc(p.description)}"><meta name="twitter:image" content="${siteUrl}/company/industry.webp">`;
          const homeHead = `<link rel="stylesheet" href="/assets/${css}"><link rel="preload" href="/company/manrope-0.woff2" as="font" type="font/woff2" crossorigin><script id="business-schema" type="application/ld+json">${json}</script>`;
          const body =
            kind === "home"
              ? `<div id="root" data-prerendered="true">${render()}</div>`
              : kind === "portal"
                ? '<div id="root"><main class="route-message" role="status">Loading employee portal…</main></div>'
                : '<div id="root"><main class="route-message"><h1>Page not found</h1><a href="/">Return to HST Enterprises</a></main></div>';
          const dest = path.join(
            out,
            kind === "home"
              ? "index.html"
              : kind === "portal"
                ? "portal/index.html"
                : "404.html",
          );
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(
            dest,
            base
              .replace(
                "<!--page-head-->",
                meta + (kind === "home" ? homeHead : ""),
              )
              .replace('<div id="root"></div>', body),
          );
        }
        await fs.writeFile(
          path.join(out, "..", "schema-csp-hash.txt"),
          `'sha256-${createHash("sha256").update(json).digest("base64")}'`,
        );
        console.log("Pre-rendered homepage, portal metadata and 404 page.");
      } finally {
        await server.close();
      }
    },
  };
}
