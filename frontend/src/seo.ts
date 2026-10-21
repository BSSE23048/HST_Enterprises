import { company, services } from "./corporate/content";
export const siteUrl = "https://hstenterprisespk.com";
export const pages = {
  home: {
    title: "Industrial Electrical Supplier in Lahore | HST Enterprises",
    description:
      "HST Enterprises supplies industrial cables, MCCB and MCB breakers, electrical switchgear, AMF/ATS panels and technical services from Brandreth Road, Lahore.",
    path: "/",
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
      description: pages.home.description,
      telephone: "+923004025599",
      email: company.email,
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
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Electrical supply and technical services",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.title,
            description: s.description,
            provider: { "@id": `${siteUrl}/#organization` },
          },
        })),
      },
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
export function applyMetadata(kind: keyof typeof pages) {
  const page = pages[kind];
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
  if (kind !== "home") document.getElementById("business-schema")?.remove();
}
