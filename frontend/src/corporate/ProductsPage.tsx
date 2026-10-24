import Navigation from './Navigation';
import { Footer } from './CorporateSite';
import ProductCatalogue from './ProductCatalogue';
import { type CatalogueCategoryPage } from './catalogueCategories';
import { categories, categoryPath } from './categories';
import { Icon } from './Icons';
import { company, whatsappLink } from './content';
import './corporate.css';
import './products-page.css';

export default function ProductsPage({ category }: { category?: CatalogueCategoryPage }) {
  return <div className="corporate products-page">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Navigation homeLinks/>
    <main id="main-content" tabIndex={-1}>
      <header className="section-inner products-intro">
        <nav aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true"> / </span>{category ? <><a href="/products">Products</a><span aria-hidden="true"> / </span><span aria-current="page">{category.name}</span></> : <span aria-current="page">Products</span>}</nav>
        <h1>{category?.name || 'Electrical Product Catalogue'}</h1>
        <p>{category?.description || 'Browse electrical protection, motor control, cables, panel accessories and control components from HST Enterprises in Lahore. Compare listed variants and send the selected requirement to our team at 15-Brandreth Road, Lahore.'}</p>
        {category && <p>{category.enquiryHint}</p>}
        <a className="text-link products-email-link" href={`mailto:${company.salesEmail}?subject=${encodeURIComponent('Material list / product sourcing enquiry' + (category ? ': ' + category.name : ''))}`}><Icon name="mail" size={18}/> Prefer email? {company.salesEmail}</a>
        {category && <a className="text-link" href="/products">Back to All Products <Icon name="arrow" size={18}/></a>}
      </header>
      <ProductCatalogue fixedCategory={category?.name}/>
      <nav className="section-inner catalogue-sourcing-links" aria-label="Electrical sourcing guides">
        <h2>Electrical sourcing guides</h2>
        <div className="catalogue-category-links">{categories.filter(item => !category || item.slug === category.guideSlug).map(item => <a key={item.slug} href={categoryPath(item)}>{item.name}</a>)}</div>
      </nav>
    </main>
    <Footer homeLinks/>
    <a className="floating-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="Chat with HST Enterprises on WhatsApp"><Icon name="whatsapp" size={27}/></a>
  </div>;
}
