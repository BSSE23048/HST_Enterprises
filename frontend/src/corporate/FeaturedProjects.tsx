import { useState, useId } from 'react';
import { Reveal } from './CorporateSite';
import { Icon } from './Icons';
import { whatsappLink } from './content';

export interface MegaProject {
  id: string;
  category: 'infrastructure' | 'real-estate' | 'industrial';
  title: string;
  clientOrLocation: string;
  contractor: string;
  badge: string;
  heroStat: string;
  heroStatLabel: string;
  shortDesc: string;
  fullCaseStudy: string;
  suppliedItems: string[];
  keySpecs: string[];
  image: string;
  accentColor: string;
}

export interface ClientItem {
  name: string;
  sector: 'Real Estate' | 'Textile & Dyeing' | 'Manufacturing' | 'Food & Agriculture';
  location: string;
  role: string;
  highlight: string;
}

export const megaProjects: MegaProject[] = [
  {
    id: 'pkli-lahore',
    category: 'infrastructure',
    title: 'Pakistan Kidney & Liver Institute (PKLI)',
    clientOrLocation: 'Lahore, Pakistan',
    contractor: 'SPARCO Construction Company',
    badge: 'Mega Medical Infrastructure',
    heroStat: '100% Medical Grade',
    heroStatLabel: 'Zero-Downtime Power Compliance',
    shortDesc: 'Complete industrial and electrical infrastructure supply for Pakistan’s flagship tertiary organ transplant medical center.',
    fullCaseStudy: 'As the flagship medical institute for organ transplantation in Pakistan, PKLI demanded absolute zero-downtime electrical reliability and surgical-grade power quality. Partnering directly with SPARCO Construction Company, HST Enterprises engineered and supplied the primary industrial electrical infrastructure. We delivered heavy-duty switchgear assemblies, main distribution boards, high-ampere Molded Case Circuit Breakers (MCCBs), and specialized low-smoke zero-halogen (LSZH) power distribution cabling engineered for mission-critical healthcare operations.',
    suppliedItems: [
      'Heavy-duty industrial switchgear assemblies',
      'High-ampere Molded Case Circuit Breakers (MCCBs & ACBs)',
      'Medical-grade low-smoke zero-halogen (LSZH) power cables',
      'Main & sub-distribution panels (MDBs & SDBs)',
      'Power quality monitoring & surge protection hardware'
    ],
    keySpecs: [
      'Primary Contractor: SPARCO Construction Company',
      'Location: Bedian Road, Lahore',
      'Supply Scope: Full Sub-Station & Hospital Distribution Infrastructure',
      'Compliance: Surgical-Grade Zero-Interruption Power Standards'
    ],
    image: '/company/industry.webp',
    accentColor: '#38bdf8'
  },
  {
    id: 'lyari-expressway',
    category: 'infrastructure',
    title: 'Lyari Expressway Highway Network',
    clientOrLocation: 'Karachi, Pakistan',
    contractor: 'Progressive Multi Engineers (PME)',
    badge: 'National Infrastructure Megaproject',
    heroStat: '50+ Kilometers',
    heroStatLabel: 'Cable Duct Networks & Distribution',
    shortDesc: 'Primary supplier of massive underground cable duct networks and heavy electrical infrastructure across Karachi’s main expressway artery.',
    fullCaseStudy: 'Spanning Karachi’s vital transport corridor, the Lyari Expressway stands as one of the largest highway infrastructure megaprojects in Southern Pakistan. Contracted via Islamabad-based engineering giant Progressive Multi Engineers (PME), HST Enterprises served as the primary supply chain partner for heavy electrical infrastructure. We procured, quality-tested, and delivered extensive underground cable ducting systems, heavy-duty armored power cables, high-voltage junction boxes, and weather-resistant outdoor power enclosures capable of enduring coastal saline air and extreme thermal stress.',
    suppliedItems: [
      'Heavy-duty underground cable ducting & conduit networks',
      'Armored high-voltage power transmission cables',
      'Highway electrical distribution & lighting junction boxes',
      'Weather-resistant outdoor electrical enclosures & pedestals',
      'Feeder pillars and high-capacity circuit protection assemblies'
    ],
    keySpecs: [
      'Primary Contractor: Progressive Multi Engineers (Islamabad)',
      'Location: Karachi Corridor, Sindh',
      'Supply Scope: Cable Duct Network & Heavy Electrical Infrastructure',
      'Environmental Specs: Coastal Saline & High-Thermal Rated Enclosures'
    ],
    image: '/company/power.webp',
    accentColor: '#fbbf24'
  },
  {
    id: 'dolmen-mall',
    category: 'infrastructure',
    title: 'Dolmen Mall Commercial Complex',
    clientOrLocation: 'Lahore, Pakistan',
    contractor: 'Al-Bario Engineering Pvt Ltd (AEPL)',
    badge: 'Mega Commercial Retail Hub',
    heroStat: 'Multi-Megawatt',
    heroStatLabel: 'Industrial Switchgear & ACB Assemblies',
    shortDesc: 'High-capacity industrial switchgear and heavy-duty commercial electrical components for Punjab’s premier retail and leisure complex.',
    fullCaseStudy: 'Dolmen Mall Lahore represents one of the largest and most sophisticated commercial retail developments in the region. Working alongside premier electromechanical contractor Al-Bario Engineering Pvt Ltd (AEPL), HST Enterprises supplied the core industrial switchgear and high-breaking-capacity circuit protection assemblies required to support immense commercial power demands. Our supply chain scope encompassed multi-tier Air Circuit Breakers (ACBs), Molded Case Circuit Breakers (MCCBs), power factor correction (PFC) panel components, and busbar trunking accessories.',
    suppliedItems: [
      'High-capacity Air Circuit Breakers (ACBs)',
      'Multi-tier Molded Case Circuit Breakers (MCCBs)',
      'Power Factor Correction (PFC) capacitor bank components',
      'Busbar trunking connection systems & accessories',
      'Commercial automation & energy distribution boards'
    ],
    keySpecs: [
      'Primary Contractor: Al-Bario Engineering Pvt Ltd (AEPL)',
      'Location: DHA Phase 6, Lahore',
      'Supply Scope: Heavy Industrial Switchgear & Power Protection',
      'Load Rating: Multi-Megawatt Commercial Grid Integration'
    ],
    image: '/company/industry-small.webp',
    accentColor: '#34d399'
  }
];

export const continuousClients: ClientItem[] = [
  {
    name: 'Blue World City',
    sector: 'Real Estate',
    location: 'Islamabad / Rawalpindi',
    role: 'Continuous Infrastructure Supply Partner',
    highlight: 'Underground power cabling, feeder pillars, distribution boxes, and street lighting control gear across major residential sectors.'
  },
  {
    name: 'Paragon City',
    sector: 'Real Estate',
    location: 'Lahore',
    role: 'Urban Electrical Supply Partner',
    highlight: 'Ongoing procurement of main distribution boards, circuit breakers (MCBs/MCCBs), and phase expansion cabling.'
  },
  {
    name: 'Al Rehman Garden',
    sector: 'Real Estate',
    location: 'Lahore',
    role: 'Township Infrastructure Partner',
    highlight: 'Supply of high-voltage transformer cables, localized distribution pillars, and continuous town maintenance hardware.'
  },
  {
    name: 'The Oasis Golf & Aqua Resort',
    sector: 'Real Estate',
    location: 'Lahore',
    role: 'Resort Power & Maintenance Supplier',
    highlight: 'Outdoor-grade weather-proof electrical gear, resort distribution switchboards, and heavy-duty pump automation panels.'
  },
  {
    name: 'MRL Textiles',
    sector: 'Textile & Dyeing',
    location: 'Punjab Industrial Zone',
    role: '24/7 Industrial Sourcing Partner',
    highlight: 'Heavy motor control gear, thermal overload relays, power factor panels, and high-temperature industrial wiring for continuous weaving lines.'
  },
  {
    name: 'Crescent Dyeing',
    sector: 'Textile & Dyeing',
    location: 'Faisalabad / Lahore',
    role: 'Heavy Chemical & Plant Sourcing',
    highlight: 'Moisture and chemical-resistant industrial control panels, heavy-duty contactors, and high-frequency power distribution gear.'
  },
  {
    name: 'Pakistan Tiles',
    sector: 'Manufacturing',
    location: 'Industrial Estate',
    role: 'Heavy Manufacturing Supply Partner',
    highlight: 'Dust-sealed kiln power switchgear, high-ampere circuit breakers, and 24/7 emergency plant maintenance supplies.'
  },
  {
    name: 'AR Foods',
    sector: 'Food & Agriculture',
    location: 'Lahore',
    role: 'Food-Grade Automation Sourcing',
    highlight: 'Food-grade stainless electrical control panels, motor protection circuit breakers, and cleanroom power distribution accessories.'
  },
  {
    name: 'Ali Rice Mills',
    sector: 'Food & Agriculture',
    location: 'Punjab Rice Belt',
    role: 'Processing Plant Electrical Partner',
    highlight: 'Heavy-duty industrial cables, grain processing plant starter panels, and AMF/ATS generator synchronization panels.'
  },
  {
    name: 'AR Chaudhry',
    sector: 'Food & Agriculture',
    location: 'Lahore / Sheikhupura',
    role: 'Agro-Industrial Supply Partner',
    highlight: 'High-capacity agricultural power infrastructure, submersible pump starters, and heavy-duty distribution hardware.'
  }
];

export default function FeaturedProjects() {
  const [activeTab, setActiveTab] = useState<'all' | 'infrastructure' | 'real-estate' | 'industrial'>('all');
  const [selectedProject, setSelectedProject] = useState<MegaProject | null>(null);
  const modalHeadingId = useId();

  const filteredMega = activeTab === 'all'
    ? megaProjects
    : megaProjects.filter(p => p.category === activeTab);

  const filteredClients = activeTab === 'all'
    ? continuousClients
    : activeTab === 'real-estate'
      ? continuousClients.filter(c => c.sector === 'Real Estate')
      : activeTab === 'industrial'
        ? continuousClients.filter(c => c.sector !== 'Real Estate')
        : continuousClients;

  return (
    <section className="featured-projects-section section-space" id="projects" tabIndex={-1}>
      <div className="section-inner">
        {/* Section Header */}
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow"><span />PROVEN TRACK RECORD & INDUSTRIAL FOOTPRINT</p>
            <h2>Empowering Megaprojects.<br /><em>Engineered for Industry.</em></h2>
          </div>
          <p className="section-description">
            From national highway cable networks and state-of-the-art medical institutes to commercial shopping malls and continuous industrial manufacturing lines — explore how <strong>HST Enterprises</strong> powers Pakistan’s critical infrastructure.
          </p>
        </Reveal>

        {/* Industrial Stats Summary Bar */}
        <Reveal className="projects-stats-bar" delay={0.1}>
          <div className="stat-card">
            <span className="stat-number">50+ MW</span>
            <span className="stat-label">Power Infrastructure Sourced</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100+ KM</span>
            <span className="stat-label">Cable Ducting & Heavy Wiring</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Contracted Spec Compliance</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">24 / 7</span>
            <span className="stat-label">Industrial Emergency Supply SLA</span>
          </div>
        </Reveal>

        {/* Category Tabs */}
        <div className="projects-filter-bar" role="tablist" aria-label="Project sector filters">
          {[
            { id: 'all', label: 'All Portfolio Showcase' },
            { id: 'infrastructure', label: 'Mega Infrastructure & Commercial' },
            { id: 'real-estate', label: 'Real Estate & Urban Development' },
            { id: 'industrial', label: 'Industrial, Textile & Processing' },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Featured Case-Study Cards (Mega Projects) */}
        {(activeTab === 'all' || activeTab === 'infrastructure') && (
          <div className="mega-projects-grid">
            {filteredMega.map((project, idx) => (
              <Reveal key={project.id} delay={idx * 0.08} className="mega-project-card">
                <div className="project-card-header">
                  <span className="project-badge" style={{ borderColor: project.accentColor, color: project.accentColor }}>
                    <Icon name="check" size={13} /> {project.badge}
                  </span>
                  <span className="project-contractor">Contracted via <strong>{project.contractor}</strong></span>
                </div>

                <div className="project-card-body">
                  <div className="project-title-area">
                    <h3>{project.title}</h3>
                    <span className="project-location"><Icon name="globe" size={14} /> {project.clientOrLocation}</span>
                  </div>

                  <p className="project-short-desc">{project.shortDesc}</p>

                  <div className="project-highlight-box">
                    <span className="highlight-val">{project.heroStat}</span>
                    <span className="highlight-lbl">{project.heroStatLabel}</span>
                  </div>

                  <div className="project-supplied-tags">
                    {project.suppliedItems.slice(0, 3).map(item => (
                      <span key={item} className="supply-tag">{item}</span>
                    ))}
                    {project.suppliedItems.length > 3 && (
                      <span className="supply-tag-more">+{project.suppliedItems.length - 3} more items</span>
                    )}
                  </div>
                </div>

                <div className="project-card-footer">
                  <button
                    className="button button-outline-glass"
                    onClick={() => setSelectedProject(project)}
                    aria-label={`View detailed case study for ${project.title}`}
                  >
                    Read Technical Case Study <Icon name="diagonal" size={16} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Continuous Clients & Real Estate Showcase Grid */}
        <Reveal className="continuous-clients-wrapper" delay={0.15}>
          <div className="continuous-clients-header">
            <div>
              <p className="eyebrow"><span />CONTINUOUS SUPPLY PARTNERSHIPS</p>
              <h3>Urban Housing Developments & 24/7 Industrial Facilities</h3>
            </div>
            <p>
              Beyond single projects, HST Enterprises serves as the long-term, on-demand supply chain backbone for premier housing authorities, textile mills, tile manufacturers, and food processing plants across Pakistan.
            </p>
          </div>

          <div className="continuous-clients-grid">
            {filteredClients.map((client, i) => (
              <div key={client.name + i} className="client-feature-card">
                <div className="client-card-top">
                  <span className="client-sector-pill">{client.sector}</span>
                  <span className="client-location">{client.location}</span>
                </div>
                <h4 className="client-name">{client.name}</h4>
                <p className="client-role">{client.role}</p>
                <p className="client-highlight">{client.highlight}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* CRITICAL "THE MASSIVE FOOTPRINT" DISCLAIMER BANNER */}
        <Reveal className="massive-footprint-banner" delay={0.2}>
          <div className="footprint-glow" />
          <div className="footprint-content">
            <div className="footprint-icon-box">
              <Icon name="power" size={36} />
            </div>
            <div className="footprint-text">
              <span className="footprint-eyebrow">THE MASSIVE FOOTPRINT</span>
              <blockquote>
                “These highlighted projects represent only a fraction of our extensive portfolio. HST Enterprises has been the trusted backbone for hundreds of other unnamed construction giants, industries, and commercial developments across Pakistan, delivering unparalleled electrical and industrial supply chain solutions.”
              </blockquote>
              <div className="footprint-meta">
                <span><Icon name="check" size={16} /> Certified Quality Sourcing</span>
                <span><Icon name="check" size={16} /> 100% Authentic Brands</span>
                <span><Icon name="check" size={16} /> Nationwide Delivery</span>
              </div>
            </div>
            <div className="footprint-action">
              <a href="#contact" className="button button-maroon">
                Procure for Your Project <Icon name="diagonal" size={18} />
              </a>
            </div>
          </div>
        </Reveal>

        {/* Sleek Infinite-Scroll Marquee for Brand & Client Names */}
        <div className="clients-marquee-section" aria-label="Trusted client partners marquee">
          <span className="marquee-title">TRUSTED BY PROCUREMENT MANAGERS & FACTORY LEADERS ACROSS PAKISTAN</span>
          <div className="marquee-track">
            <div className="marquee-content">
              {['SPARCO Construction', 'Progressive Multi Engineers', 'Al-Bario Engineering (AEPL)', 'PKLI Hospital', 'Lyari Expressway', 'Dolmen Mall Lahore', 'Blue World City', 'Paragon City', 'Al Rehman Garden', 'The Oasis Resort', 'MRL Textiles', 'Crescent Dyeing', 'Pakistan Tiles', 'AR Foods', 'Ali Rice Mills', 'AR Chaudhry'].map((name, idx) => (
                <span key={name + idx} className="marquee-item">
                  <span className="marquee-dot" /> {name}
                </span>
              ))}
            </div>
            <div className="marquee-content" aria-hidden="true">
              {['SPARCO Construction', 'Progressive Multi Engineers', 'Al-Bario Engineering (AEPL)', 'PKLI Hospital', 'Lyari Expressway', 'Dolmen Mall Lahore', 'Blue World City', 'Paragon City', 'Al Rehman Garden', 'The Oasis Resort', 'MRL Textiles', 'Crescent Dyeing', 'Pakistan Tiles', 'AR Foods', 'Ali Rice Mills', 'AR Chaudhry'].map((name, idx) => (
                <span key={name + 'dup' + idx} className="marquee-item">
                  <span className="marquee-dot" /> {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case Study Technical Detail Modal / Drawer */}
      {selectedProject && (
        <div
          className="project-modal-overlay"
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalHeadingId}
        >
          <div className="project-modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedProject(null)}
              aria-label="Close project modal"
            >
              <Icon name="close" size={20} />
            </button>

            <div className="modal-header">
              <span className="project-badge" style={{ borderColor: selectedProject.accentColor, color: selectedProject.accentColor }}>
                {selectedProject.badge}
              </span>
              <h3 id={modalHeadingId}>{selectedProject.title}</h3>
              <p className="modal-sub">
                Location: <strong>{selectedProject.clientOrLocation}</strong> | Contracted via: <strong>{selectedProject.contractor}</strong>
              </p>
            </div>

            <div className="modal-body">
              <div className="modal-case-section">
                <h4>Executive Summary & Supply Scope</h4>
                <p>{selectedProject.fullCaseStudy}</p>
              </div>

              <div className="modal-grid-details">
                <div className="modal-details-col">
                  <h4><Icon name="check" size={16} /> Supplied Electrical & Industrial Components</h4>
                  <ul>
                    {selectedProject.suppliedItems.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-details-col">
                  <h4><Icon name="diagonal" size={16} /> Project Engineering Specifications</h4>
                  <ul>
                    {selectedProject.keySpecs.map(spec => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <a
                href={whatsappLink(`Hello HST Enterprises team, I am reviewing your project portfolio for ${selectedProject.title} (Contractor: ${selectedProject.contractor}). I would like to discuss a similar industrial or electrical supply requirement for our project.`)}
                target="_blank"
                rel="noreferrer"
                className="button button-maroon"
              >
                Discuss Similar Supply Scope on WhatsApp <Icon name="diagonal" size={18} />
              </a>
              <button className="button button-outline-glass" onClick={() => setSelectedProject(null)}>
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
