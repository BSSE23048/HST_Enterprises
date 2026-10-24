import { Reveal } from './Reveal';
import { Icon } from './Icons';
import { whatsappLink } from './content';

const projects = [
  { name: 'Pakistan Kidney & Liver Institute (PKLI)', context: 'Healthcare project', copy: 'HST Enterprises has project supply experience involving PKLI. Contact our team to discuss procurement requirements for your healthcare facility.' },
  { name: 'Dolmen Mall', context: 'Commercial project', copy: 'Our project supply experience includes Dolmen Mall. We welcome enquiries for electrical products and procurement requirements for commercial facilities.' },
  { name: 'Lyari Expressway', context: 'Infrastructure project', copy: 'Our project supply experience includes Lyari Expressway. Speak with our team about electrical supply requirements for your infrastructure project.' },
];

export default function FeaturedProjects() {
  return <section className="featured-projects-section section-space" id="projects" tabIndex={-1}>
    <div className="section-inner">
      <Reveal className="section-heading"><div><p className="eyebrow"><span/>PROJECT SUPPLY EXPERIENCE</p><h2>Experience behind<br/><em>your next requirement.</em></h2></div><p className="section-description">HST Enterprises has supply experience involving healthcare, commercial and infrastructure projects in Pakistan.</p></Reveal>
      <div className="mega-projects-grid">{projects.map(project => <article className="mega-project-card" key={project.name}>
        <div className="project-card-header"><span className="project-badge"><Icon name="check" size={13}/> {project.context}</span></div>
        <div className="project-card-body"><div className="project-title-area"><h3>{project.name}</h3></div><p className="project-short-desc">{project.copy}</p>
          <details><summary>Discuss a similar requirement</summary><p>Share your approved specifications, bill of quantities and delivery schedule. Each enquiry is reviewed against its own scope; past project involvement does not establish the specification for a new project.</p></details>
        </div>
        <div className="project-card-footer"><a className="button button-outline-glass" href={whatsappLink(`Hello HST Enterprises, I saw your project supply experience involving ${project.name}. I would like to discuss an electrical supply quotation for my project.`)} target="_blank" rel="noreferrer">Discuss your project <Icon name="diagonal" size={16}/></a></div>
      </article>)}</div>
      <p className="section-description">Project names identify supply experience only. They do not imply endorsement, exclusive contracts or ownership of these projects.</p>
    </div>
  </section>;
}
