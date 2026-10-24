export interface Category {
  slug: string;
  name: string;
  title: string;
  description: string;
  introduction: string;
  products: string[];
  applications: string;
  requirements: string[];
  guidance: string;
}

export const categories: Category[] = [
  {
    slug: 'industrial-switchgear',
    name: 'Industrial switchgear',
    title: 'Industrial Switchgear Supplier in Lahore | HST Enterprises',
    description: 'Source industrial switchgear and power distribution components in Lahore. Send HST Enterprises your panel schedule and project requirements for a quotation.',
    introduction: 'HST Enterprises supports electrical contractors, factory maintenance teams and procurement departments sourcing switchgear in Lahore and across Pakistan. We work from your approved requirements to prepare a quotation for switching, protection and distribution equipment.',
    products: ['Electrical switchgear', 'Power distribution and control panels', 'AMF / ATS panels', 'Circuit protection and switching components'],
    applications: 'Typical enquiries cover factory distribution systems, commercial building electrical rooms, generator changeover arrangements and replacement components for existing panels.',
    requirements: ['Single-line diagram or panel schedule, if available', 'Required voltage, current ratings and number of poles', 'Protection, switching and enclosure requirements specified by your engineer', 'Item quantities, delivery location and required date'],
    guidance: 'For an existing installation, include equipment labels and drawings so the proposed supply can be checked against your system. Panel configuration and component suitability need to be agreed before an order is placed.',
  },
  {
    slug: 'mccb-circuit-breakers',
    name: 'MCCBs & circuit breakers',
    title: 'MCCB & Circuit Breaker Supplier Lahore | HST Enterprises',
    description: 'Enquire about MCCBs, MCBs, ELCBs and ACBs from HST Enterprises in Lahore. Share breaker ratings, quantities and application details for a project quotation.',
    introduction: 'Source circuit protection components for your approved electrical design or maintenance requirement. HST Enterprises handles enquiries for moulded-case circuit breakers and related protection devices for industrial and commercial procurement in Lahore and Pakistan.',
    products: ['Moulded-case circuit breakers (MCCBs)', 'Miniature circuit breakers (MCBs)', 'Earth leakage circuit breakers (ELCBs)', 'Air circuit breakers (ACBs)'],
    applications: 'Procurement enquiries include distribution board protection, commercial panel requirements, factory electrical maintenance and replacement of specified circuit breakers.',
    requirements: ['Breaker type, model or a clear photograph of the existing label', 'Rated current, voltage, pole count and specified breaking capacity', 'Required trip characteristics and accessories, where specified', 'Quantity and delivery deadline'],
    guidance: 'A matching current rating alone does not establish that two breakers are interchangeable. Include the complete specification and ask your electrical engineer to confirm coordination, installation compatibility and suitability.',
  },
  {
    slug: 'industrial-electrical-cables',
    name: 'Industrial electrical cables',
    title: 'Industrial Electrical Cable Supplier Lahore | HST Enterprises',
    description: 'Request power, control, flexible and earth cables in Lahore from HST Enterprises. Send cable sizes, lengths and your project schedule for a quotation.',
    introduction: 'HST Enterprises supplies industrial cable requirements from Brandreth Road, Lahore. We help procurement teams organise enquiries for power, control, flexible and earth cables against their project cable schedules, with cable ducting enquiries handled alongside the supply requirement.',
    products: ['Power cables', 'Control cables', 'Flexible cables', 'Earth cables', 'Cable ducting'],
    applications: 'Typical requirements include industrial power distribution, control panel connections, machinery wiring and building electrical infrastructure. Cable scheduling helps separate each size, type and required length before quotation.',
    requirements: ['Cable type, conductor material, core count and cross-sectional area', 'Specified voltage grade, insulation and any required armouring', 'Length required for each cable and preferred delivery lengths', 'Installation environment, delivery address and timeline'],
    guidance: 'Send the approved cable schedule where available. Cable sizing and installation suitability depend on the electrical design and site conditions; supply enquiries should use the specifications approved for your project.',
  },
  {
    slug: 'electrical-control-components',
    name: 'Electrical control components',
    title: 'Electrical Control Components Lahore | HST Enterprises',
    description: 'Source switches, relays, sensors and control panel requirements in Lahore. Contact HST Enterprises with part numbers and quantities for a B2B quotation.',
    introduction: 'HST Enterprises supports industrial automation and control procurement for factories, contractors and facility teams. Share the component list or control requirement so we can prepare a focused supply enquiry for your equipment or panel.',
    products: ['Switches and relays', 'Industrial sensors', 'Control panel components', 'PLC panel and control system requirements'],
    applications: 'Typical enquiries support production machinery controls, building automation, panel maintenance and replacement of specified switching or sensing components.',
    requirements: ['Manufacturer and exact part number, where specified', 'Supply or coil voltage and electrical ratings', 'Contact configuration, sensor output or interface requirements', 'Equipment application, quantities and required date'],
    guidance: 'For replacement parts, provide a label photograph and the relevant wiring or equipment information. Any alternative must be reviewed for electrical, mechanical and control-system compatibility before use.',
  },
];

export const categoryPath = (category: Category) => `/${category.slug}/`;
export const findCategory = (pathname: string) =>
  categories.find(category => categoryPath(category) === pathname.replace(/\/+$/, '') + '/');
