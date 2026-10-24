export const catalogueCategoryPages = [
  {
    "name": "Circuit breakers, protection & fuses",
    "slug": "circuit-protection",
    "description": "Compare listed MCCBs, MCBs, motor protection breakers, air circuit breakers and fuses for electrical protection enquiries.",
    "seoTitle": "MCCBs, MCBs & Fuses Lahore",
    "enquiryHint": "Include the device model, pole count, rated current and required breaking capacity in your enquiry.",
    "guideSlug": "mccb-circuit-breakers"
  },
  {
    "name": "Contactors, motor control, relays & timers",
    "slug": "motor-control",
    "description": "Browse contactors, operating coils, relays, timers and power factor components for motor control and panel enquiries.",
    "seoTitle": "Contactors, Relays & Timers Lahore",
    "enquiryHint": "Specify the model, coil or supply voltage, contact arrangement and quantity required.",
    "guideSlug": "electrical-control-components"
  },
  {
    "name": "Sensors, automation & power",
    "slug": "sensors-automation",
    "description": "Explore proximity and photoelectric sensors, panel meters, power supplies and cooling fans by listed model or variant.",
    "seoTitle": "Sensors & Automation Components Lahore",
    "enquiryHint": "For replacements, share the existing part number, supply voltage and output or connection details.",
    "guideSlug": "electrical-control-components"
  },
  {
    "name": "Electrical cables & wires",
    "slug": "cables-wires",
    "description": "Browse flexible, control, earth and PVC copper cables and wires by listed size, core count and brand.",
    "seoTitle": "Electrical Cables & Wires Lahore",
    "enquiryHint": "Send the conductor size, number of cores, cable type and required length for each item.",
    "guideSlug": "industrial-electrical-cables"
  },
  {
    "name": "Panels, enclosures, trays & mounting",
    "slug": "panels-enclosures",
    "description": "Find distribution boards, enclosures, cable trays, PVC strips, conduits and DIN rails for panel assembly and cable management.",
    "seoTitle": "Electrical Panels & Cable Management Lahore",
    "enquiryHint": "Include enclosure dimensions, mounting details and the quantities from your panel or installation schedule.",
    "guideSlug": "industrial-switchgear"
  },
  {
    "name": "Switches, buttons, indicators & sockets",
    "slug": "switches-indicators",
    "description": "Browse push buttons, selector switches, indicators, emergency stops and sockets for panel control and electrical connections.",
    "seoTitle": "Switches, Indicators & Sockets Lahore",
    "enquiryHint": "Confirm the contact arrangement, mounting size, operating voltage and colour where relevant.",
    "guideSlug": "electrical-control-components"
  },
  {
    "name": "Cable terminations & accessories",
    "slug": "cable-accessories",
    "description": "Explore cable lugs, ferrules, heat-shrink sleeves, cable ties and insulation tape for termination and installation enquiries.",
    "seoTitle": "Cable Lugs & Accessories Lahore",
    "enquiryHint": "State the cable size, terminal or accessory type and required quantities; confirm dimensions before ordering.",
    "guideSlug": "industrial-electrical-cables"
  }
] as const;
export const catalogueCategories = catalogueCategoryPages.map(category => category.name);
export type CatalogueCategory = typeof catalogueCategoryPages[number]['name'];
export type CatalogueCategoryPage = typeof catalogueCategoryPages[number];
export const catalogueCategoryPath = (category: CatalogueCategoryPage) => `/products/category/${category.slug}`;
export const findCatalogueCategory = (path: string) => catalogueCategoryPages.find(category => catalogueCategoryPath(category) === path.replace(/\/+$/, ''));
