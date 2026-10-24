import { useEffect, useMemo, useState } from 'react';
import { catalogueCategories, catalogueProducts, type CatalogueProduct, type CatalogueVariant } from './catalogueData';
import { whatsappLink } from './content';
import { Icon } from './Icons';
import './catalogue.css';
import './public-responsive.css';
import ProductVisual from './ProductVisual';
import { catalogueCategoryPages, catalogueCategoryPath, type CatalogueCategory } from './catalogueCategories';

const PAGE_SIZE = 12;
const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[–—-]/g, ' ').replace(/\s+/g, ' ').trim();
const matches = (product: CatalogueProduct, variant: CatalogueVariant, words: string[]) => {
  const text = normalize(`${product.brand || 'Brand not specified'} ${product.name} ${product.category} ${variant.label}`);
  return words.every(word => text.includes(word));
};
const quotationLink = (product: CatalogueProduct, variant: CatalogueVariant) => whatsappLink(
  `Hello HST Enterprises, please send a quotation for:\nProduct: ${product.brand ? product.brand + ' ' : ''}${product.name}\nSelected variant: ${variant.label}\n\nRequired quantity: \nDelivery location: \nRequired date: \n\nPlease confirm the exact specification, availability and lead time.`,
);

function ProductCard({ product, variants, ready }: { product: CatalogueProduct; variants: CatalogueVariant[]; ready: boolean }) {
  const [selectedLabel, setSelectedLabel] = useState('');
  const selected = variants.find(variant => variant.label === selectedLabel) || variants[0];
  const titleId = `catalogue-${product.id}-title`;
  const selectId = `catalogue-${product.id}-variant`;
  const noteId = `catalogue-${product.id}-verification`;
  return <article className="catalogue-card" aria-labelledby={titleId}>
    <ProductVisual product={product} variant={selected.label}/>
    <div className="catalogue-card-body">
      <p className="catalogue-brand">{product.brand || 'Brand not specified'}</p>
      <h3 id={titleId}>{product.name}</h3>
      <p className="catalogue-card-category">{product.category}</p>
      {variants.length > 1 ? <div className="catalogue-variant"><label htmlFor={selectId}>Select listed variant</label><select id={selectId} value={selected.label} disabled={!ready} aria-describedby={noteId} onChange={event => setSelectedLabel(event.target.value)}>{variants.map(variant => <option key={variant.label} value={variant.label}>{variant.label}</option>)}</select></div> : <div className="catalogue-variant"><span className="catalogue-field-label">Listed variant</span><p>{selected.label}</p></div>}
      {variants.length > 1 && <p className="catalogue-selected-variant">{selected.label}</p>}
      <p className="catalogue-verification" id={noteId}>Confirm specifications before ordering.</p>
      <p className="catalogue-availability">Availability on enquiry</p>
      <a className="button button-maroon catalogue-rfq" href={quotationLink(product, selected)} target="_blank" rel="noreferrer" aria-label={`Request quotation for ${product.brand ? product.brand + ' ' : ''}${product.name}, ${selected.label}`}>Request Quotation <Icon name="whatsapp" size={20}/></a>
    </div>
  </article>;
}

export default function ProductCatalogue({ fixedCategory }: { fixedCategory?: CatalogueCategory }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(fixedCategory || '');
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    const revealLinkedProduct = () => {
      if (!window.location.hash.startsWith('#product-')) return;
      const product = document.getElementById(window.location.hash.slice(1));
      const index = product?.closest('details');
      if (!(index instanceof HTMLDetailsElement)) return;
      index.open = true;
      product?.scrollIntoView({ block: 'start' });
    };
    revealLinkedProduct();
    window.addEventListener('hashchange', revealLinkedProduct);
    return () => window.removeEventListener('hashchange', revealLinkedProduct);
  }, []);
  useEffect(() => {
    if (fixedCategory) return;
    const applyCategoryLink = () => {
      const index = ['switchgear', 'breakers', 'cables', 'controls'].indexOf(window.location.hash.replace('#catalogue-', ''));
      if (index < 0) return;
      setCategory(catalogueCategories[[4, 0, 3, 1][index]]);
      setQuery('');
      setBrand('');
      setLimit(PAGE_SIZE);
      document.getElementById('catalogue')?.scrollIntoView({ block: 'start' });
    };
    applyCategoryLink();
    window.addEventListener('hashchange', applyCategoryLink);
    return () => window.removeEventListener('hashchange', applyCategoryLink);
  }, [fixedCategory]);
  const brands = useMemo(() => [...new Set(catalogueProducts.filter(product => !fixedCategory || product.category === fixedCategory).flatMap(product => product.brand ? [product.brand] : []))].sort(), [fixedCategory]);
  const results = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    return catalogueProducts.flatMap(product => {
      if ((fixedCategory || category) && product.category !== (fixedCategory || category)) return [];
      if (brand && (product.brand || 'unspecified') !== brand) return [];
      const variants = product.variants.filter(variant => matches(product, variant, words));
      return variants.length ? [{ product, variants }] : [];
    });
  }, [query, category, brand, fixedCategory]);
  const reset = () => { setQuery(''); setCategory(fixedCategory || ''); setBrand(''); setLimit(PAGE_SIZE); };

  return <section id="catalogue" className="product-catalogue section-space" tabIndex={-1} aria-labelledby="catalogue-title">
    {['switchgear', 'breakers', 'cables', 'controls'].map(key => <span key={key} id={`catalogue-${key}`} className="catalogue-anchor" aria-hidden="true"/>)}
    <div className="section-inner">
      <header className="catalogue-heading"><p className="eyebrow"><span/>B2B PRODUCT CATALOGUE</p><h2 id="catalogue-title">Find your next<br/><em>electrical requirement.</em></h2><p>Browse products, compare listed variants and send a focused quotation request to our Lahore team.</p></header>
      <div className="catalogue-disclosure"><strong>Tell us what your project needs.</strong> Confirm specifications before ordering. Our team will confirm the exact product, availability and lead time with your quotation.</div>
      {!fixedCategory && <nav className="catalogue-category-links" aria-label="Browse product categories">{catalogueCategoryPages.map(item => <a key={item.slug} href={catalogueCategoryPath(item)}>{item.name}</a>)}</nav>}
      <div className="catalogue-filters" role="search" aria-label="Search the product catalogue">
        <label className="catalogue-search" htmlFor="catalogue-search">Search products<input id="catalogue-search" type="search" placeholder="Product, model, rating or cable size" value={query} disabled={!ready} maxLength={120} autoComplete="off" onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }}/></label>
        {!fixedCategory && <label htmlFor="catalogue-category">Category<select id="catalogue-category" value={category} disabled={!ready} onChange={event => { setCategory(event.target.value); setLimit(PAGE_SIZE); }}><option value="">All categories</option>{catalogueCategories.map(item => <option key={item}>{item}</option>)}</select></label>}
        <label htmlFor="catalogue-brand">Brand<select id="catalogue-brand" value={brand} disabled={!ready} onChange={event => { setBrand(event.target.value); setLimit(PAGE_SIZE); }}><option value="">All brands</option>{brands.map(item => <option key={item}>{item}</option>)}<option value="unspecified">Brand not specified</option></select></label>
      </div>
      <div className="catalogue-results-bar"><p role="status" aria-live="polite" aria-atomic="true">{results.length ? `Showing ${Math.min(limit, results.length)} of ${results.length} product groups` : 'No products match these filters.'}</p>{(query || (!fixedCategory && category) || brand) && <button type="button" className="catalogue-reset" onClick={reset}>Clear filters</button>}</div>
      <noscript><p className="catalogue-disclosure">Enable JavaScript to search and select variants. The cards show their first listed variant; the complete text catalogue below provides quotation links for every listed variant.</p></noscript>
      {results.length ? <div className="catalogue-grid">{results.slice(0, limit).map(({ product, variants }) => <ProductCard key={product.id} product={product} variants={variants} ready={ready}/>)}</div> : <div className="catalogue-empty"><Icon name="supply" size={36}/><h3>Let’s find your requirement.</h3><p>Try a broader search or clear the category and brand filters. You can also send our team your product specification.</p><a href={whatsappLink('Hello HST Enterprises, I could not find my requirement in the catalogue. Please help me source the following product: ')} className="button button-maroon" target="_blank" rel="noreferrer">Ask about a product <Icon name="whatsapp" size={20}/></a></div>}
      {limit < results.length && <div className="catalogue-more"><button className="button" type="button" disabled={!ready} onClick={() => setLimit(value => value + PAGE_SIZE)}>Show more products</button></div>}
      <details className="catalogue-static" id="complete-catalogue"><summary>Complete catalogue: all products, variants and quotation links</summary><p>This complete list is independent of the filters above. Open a category to narrow your enquiry.</p>{catalogueProducts.filter(product => !fixedCategory || product.category === fixedCategory).map(product => <article key={product.id} id={`product-${product.id}`}><h3>{product.brand ? product.brand + ' ' : ''}{product.name}</h3><p><a href={catalogueCategoryPath(catalogueCategoryPages.find(item => item.name === product.category)!)}>{product.category}</a></p><p>Availability on enquiry. Confirm specifications before ordering.</p><ul>{product.variants.map(variant => <li key={variant.label}><a href={quotationLink(product, variant)} target="_blank" rel="noreferrer">Request quotation: {variant.label}</a></li>)}</ul></article>)}</details>
    </div>
  </section>;
}
