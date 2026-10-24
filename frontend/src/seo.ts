import { company } from "./corporate/content";
import { categories, categoryPath } from "./corporate/categories";
import { catalogueCategoryPages, catalogueCategoryPath, findCatalogueCategory } from './corporate/catalogueCategories';
export const siteUrl = "https://hstenterprisespk.com";
export const pages = {
  home: {
    title: "Electrical Equipment & Switchgear Supplier Lahore | HST Enterprises",
    description:
      "Source industrial switchgear, MCCBs, circuit breakers, cables and electrical control components from HST Enterprises in Lahore, Pakistan. Request a quotation.",
    path: "/",
    robots: "index, follow, max-image-preview:large",
  },
  products: {
    title: "Electrical Product Catalogue | HST Enterprises Lahore",
    description: "Browse electrical products, brands and listed variants from HST Enterprises in Lahore. Explore circuit protection, cables and control components and request a quotation.",
    path: "/products",
    robots: "index, follow, max-image-preview:large",
  },
  portal: {
    title: "Employee Portal | HST Enterprises",
    description:
      "Authorized access to HST Enterprises invoices, quotations and product management.",
    path: "/portal",
    robots: "noindex, nofollow, noarchive",
  },
  missing: {
    title: "Page Not Found | HST Enterprises",
    description:
      "Visit HST Enterprises for industrial electrical supply and services in Lahore.",
    path: "/404.html",
    robots: "noindex, nofollow",
  },
};
export type PageMetadata = typeof pages.home;
export const publicPages: PageMetadata[] = [pages.home, pages.products, ...catalogueCategoryPages.map(category => ({
  title: `${category.seoTitle} | HST Enterprises`, description: category.description + ' Request a quotation from HST Enterprises in Lahore.', path: catalogueCategoryPath(category), robots: pages.home.robots,
})), ...categories.map(category => ({
  title: category.title, description: category.description, path: categoryPath(category), robots: pages.home.robots,
}))];
export const metadataForPath = (pathname: string): PageMetadata => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/portal' || normalized.startsWith('/portal/') || normalized === '/admin') return pages.portal;
  return publicPages.find(page => (page.path.replace(/\/+$/, '') || '/') === normalized) ?? pages.missing;
};
export const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "Organization"],
      "@id": `${siteUrl}/#organization`,
      name: company.name,
      url: `${siteUrl}/`,
      logo: `${siteUrl}/favicon-192.png`,
      image: `${siteUrl}/company/industry.webp`,
      description: `${pages.home.description} Project supply experience includes PKLI, Dolmen Mall and Lyari Expressway.`,
      telephone: `+${company.whatsapp}`,
      email: company.email,
      contactPoint: [
        { "@type": "ContactPoint", contactType: "general enquiries and support", email: company.email },
        { "@type": "ContactPoint", contactType: "sales and quotations", email: company.salesEmail },
      ],
      sameAs: [company.linkedin],
      hasMap: company.maps,
      areaServed: { "@type": "Country", name: "Pakistan" },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00", closes: "20:00",
      }],
      address: {
        "@type": "PostalAddress",
        streetAddress: "6-Muhammadia Electric Market, 15-Brandreth Road",
        addressLocality: "Lahore",
        addressRegion: "Punjab",
        addressCountry: "PK",
      },
      knowsAbout: [
        "Industrial cables",
        "MCCBs",
        "MCBs",
        "ELCBs",
        "ACBs",
        "Electrical switchgear",
        "AMF/ATS panels",
        "PLC panels",
        "Motor control panels",
        "Power factor improvement plants",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "HST Enterprises",
      alternateName: "HST",
      url: `${siteUrl}/`,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      name: pages.home.title,
      url: `${siteUrl}/`,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
    },
  ],
};
export function schemaForPage(page: PageMetadata, products?: { id: string; name: string; brand: string | null }[]) {
  return {
    "@context": schema["@context"],
    "@graph": [
      ...schema["@graph"].filter(entity => entity["@type"] !== "WebPage"),
      { "@type": page.path === '/products' || findCatalogueCategory(page.path) ? "CollectionPage" : "WebPage", "@id": `${siteUrl}${page.path}#webpage`, url: siteUrl + page.path,
        name: page.title, description: page.description, inLanguage: "en",
        ...(products ? { mainEntity: { "@id": `${siteUrl}${page.path}#catalogue-list` } } : {}),
        isPartOf: { "@id": `${siteUrl}/#website` }, about: { "@id": `${siteUrl}/#organization` },
        ...(page.path !== '/' ? { breadcrumb: { "@id": `${siteUrl}${page.path}#breadcrumb` } } : {}),
      },
      ...(products ? [{
        "@type": "ItemList", "@id": `${siteUrl}${page.path}#catalogue-list`,
        name: page.title, numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem", position: index + 1,
          name: `${product.brand ? product.brand + ' ' : ''}${product.name}`,
          url: `${siteUrl}${page.path}#product-${product.id}`,
        })),
      }] : []),
      ...(page.path === '/' ? [] : [{ "@type": "BreadcrumbList", "@id": `${siteUrl}${page.path}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        ...(findCatalogueCategory(page.path) ? [
          { "@type": "ListItem", position: 2, name: "Products", item: siteUrl + "/products" },
          { "@type": "ListItem", position: 3, name: findCatalogueCategory(page.path)!.name, item: siteUrl + page.path },
        ] : [{ "@type": "ListItem", position: 2, name: page.path === '/products' ? 'Products' : categories.find(c => categoryPath(c) === page.path)?.name ?? page.title, item: siteUrl + page.path }]),
      ] }]),
    ],
  };
}
export function applyMetadata(page: PageMetadata) {
  document.title = page.title;
  const entries = [
    ["name", "description", page.description],
    ["name", "robots", page.robots],
    ["property", "og:title", page.title],
    ["property", "og:description", page.description],
    ["property", "og:url", siteUrl + page.path],
    ["name", "twitter:title", page.title],
    ["name", "twitter:description", page.description],
  ];
  for (const [attr, key, value] of entries) {
    let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.append(tag);
    }
    tag.content = value;
  }
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.append(link);
  }
  link.href = siteUrl + page.path;
  if (!publicPages.some(publicPage => publicPage.path === page.path)) document.getElementById("business-schema")?.remove();
}
