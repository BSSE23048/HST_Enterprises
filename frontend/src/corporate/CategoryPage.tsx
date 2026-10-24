import { catalogueCategoryPages, catalogueCategoryPath } from './catalogueCategories';
import Navigation from './Navigation';
import { Footer } from './CorporateSite';
import { categories, categoryPath, type Category } from './categories';
import { company, mapLink, whatsappLink } from './content';
import { Icon } from './Icons';
import './corporate.css';
import './public-responsive.css';

export default function CategoryPage({ category }: { category: Category }) {
  const enquiry = whatsappLink(`Hello HST Enterprises, I would like a quotation for ${category.name.toLowerCase()}.\nCompany: \nSpecifications or part numbers: \nQuantities: \nDelivery location: \nRequired date: `);
  return <div className="corporate">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Navigation homeLinks/>
    <main id="main-content" tabIndex={-1} className="category-page section-inner">
      <nav aria-label="Breadcrumb" className="category-breadcrumb"><a href="/">Home</a><span aria-hidden="true"> / </span><span aria-current="page">{category.name}</span></nav>
      <article>
        <header className="category-intro"><p className="eyebrow">HST ENTERPRISES · LAHORE, PAKISTAN</p><h1>{category.name}</h1><p className="section-description">{category.introduction}</p>
          <div className="hero-actions"><a className="button button-maroon" href={enquiry} target="_blank" rel="noreferrer">Request a quotation <Icon name="whatsapp" size={20}/></a><a className="text-link" href={`tel:+${company.whatsapp}`}>Call {company.phone}</a></div>
        </header>
        <nav className="category-catalogue-link" aria-label="Browse related catalogue products">
          {catalogueCategoryPages.filter(item => item.guideSlug === category.slug).map(item => <a key={item.slug} href={catalogueCategoryPath(item)} className="text-link">{item.name} <Icon name="arrow" size={18}/></a>)}
        </nav>
        <div className="category-content-grid">
          <section><h2>Products and supply enquiries</h2><ul>{category.products.map(item => <li key={item}>{item}</li>)}</ul><p>Availability and lead times are confirmed against your enquiry.</p><h2>Typical applications</h2><p>{category.applications}</p></section>
          <section><h2>What to include in your RFQ</h2><ul>{category.requirements.map(item => <li key={item}>{item}</li>)}</ul><p>{category.guidance}</p></section>
        </div>
        <section className="category-contact"><h2>Discuss your procurement requirement</h2><p>Send your bill of quantities, approved specifications or part list. Our Lahore team will review the requirement and discuss a quotation.</p><div className="hero-actions"><a className="button button-maroon" href={enquiry} target="_blank" rel="noreferrer">Enquire on WhatsApp</a><a className="text-link" href={`mailto:${company.salesEmail}?subject=${encodeURIComponent('Quotation request: ' + category.name)}`}>Email your RFQ</a></div><address>{company.address}<br/><a href={`tel:+${company.whatsapp}`}>{company.phone}</a></address><p>{company.hours}</p><a href={mapLink} target="_blank" rel="noreferrer">Find our Lahore office</a></section>
        <nav className="category-related" aria-label="Related product categories"><h2>Related product categories</h2>{categories.filter(item => item.slug !== category.slug).map(item => <a key={item.slug} href={categoryPath(item)}>{item.name} <Icon name="arrow" size={16}/></a>)}</nav>
      </article>
    </main>
    <Footer homeLinks/>
    <a className="floating-whatsapp" href={enquiry} target="_blank" rel="noreferrer" aria-label={`Enquire about ${category.name} on WhatsApp`}><Icon name="whatsapp" size={27}/><span>Request a quote</span></a>
  </div>;
}
