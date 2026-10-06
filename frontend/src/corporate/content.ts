export const company = {
  name: 'HST Enterprises',
  tagline: 'Power for your trust.',
  phone: '+92 300 4025599',
  telephone: '+92 42 37664202',
  email: 'hstenterprisespk@gmail.com',
  address: '6-Muhammadia Electric Market, 15-Brandreth Road, Lahore, Pakistan',
  whatsapp: '923004025599',
};
export const whatsappLink = (message = 'Hello HST Enterprises, I would like to discuss an industrial or electrical requirement. Please connect me with your team.') =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`;

export const services = [
  { icon: 'supply', title: 'Electrical & industrial supply', description: 'The right components for the job. A considered range of protection (MCCBs, MCBs, ELCBs, ACBs), switching, hardware, and industrial essentials.', tags: ['MCCBs & MCBs', 'ELCBs & ACBs', 'Switches & relays'] },
  { icon: 'power', title: 'Power & control panels', description: 'Purpose-built power distribution, switchgear, and control solutions, prepared around the requirements of your operation.', tags: ['Control panels', 'Switchgear', 'AMF / ATS panels'] },
  { icon: 'automation', title: 'Automation & controls', description: 'Bring precision to your processes with industrial and building automation components and control solutions.', tags: ['PLC panels', 'Sensors', 'Control systems'] },
  { icon: 'install', title: 'Installation & commissioning', description: 'From equipment placement to bringing systems into service, coordinated electrical and mechanical installation support.', tags: ['Electrical systems', 'Gensets & canopies', 'Mechanical systems'] },
  { icon: 'maintenance', title: 'Maintenance & technical services', description: 'Keep essential equipment working with responsive servicing and practical technical support for industrial systems.', tags: ['Equipment servicing', 'System maintenance', 'Technical support'] },
  { icon: 'cable', title: 'Cables & infrastructure', description: 'Connect every part of your operation with industrial cables, power, control, flexible, and earth cables, plus layout and scheduling support.', tags: ['Industrial cables', 'Power & control cables', 'Scheduling'] },
] as const;

export const industries = [
  { name: 'Manufacturing', title: 'Keep production moving.', copy: 'From motor control to the components on your production floor, we help source and support the systems your operation depends on.', items: ['Industrial controls & sensors', 'Power distribution & protection', 'Equipment maintenance'] },
  { name: 'Construction', title: 'Build on a dependable foundation.', copy: 'Electrical supply and installation support that connects your project requirements with practical, coordinated solutions.', items: ['Distribution boards & switchgear', 'Power cables & cable planning', 'Electrical & mechanical installation'] },
  { name: 'Healthcare', title: 'Support the systems that matter.', copy: 'Power, control, and electrical products for hospital facilities, sourced against your technical specifications and maintenance needs.', items: ['Critical power components', 'Protection & switching', 'Facility electrical supplies'] },
  { name: 'Hospitality', title: 'Behind every seamless stay.', copy: 'From building controls to everyday electrical essentials, dependable sourcing for hotels and hospitality facilities.', items: ['Building automation & controls', 'Electrical maintenance supplies', 'Power & distribution components'] },
  { name: 'Trade & services', title: 'A partner for your next requirement.', copy: 'A responsive supply partner for traders, wholesalers, and service providers, with general items sourced around each requirement.', items: ['Electrical & hardware sourcing', 'General industrial items', 'Requirement-based supply'] },
];
export const brands = ['Schneider Electric', 'CHINT', 'ABB', 'Fuji Electric', 'COPPERGAT', 'AZMAT CABLES'];
