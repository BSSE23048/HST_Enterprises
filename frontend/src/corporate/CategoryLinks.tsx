import { catalogueCategoryPages as categories, catalogueCategoryPath as categoryPath } from './catalogueCategories';
import { Icon } from './Icons';
import './products-page.css';

export function CategoryLinks() {
  return <section id="catalogue" className="section-inner section-space category-directory featured-categories" aria-labelledby="product-categories">
    <p className="eyebrow">PRODUCT SOURCING · LAHORE & PAKISTAN</p>
    <h2 id="product-categories">Browse Categories</h2>
    <div className="featured-category-grid">{categories.map(category => <a className="featured-category-card" key={category.slug} href={categoryPath(category)}>
      <h3>{category.name}</h3><p>{category.description}</p><span className="text-link">Browse products <Icon name="arrow" size={18}/></span>
    </a>)}</div>
    <a className="button button-maroon" href="/products">View All Products <Icon name="arrow" size={18}/></a>
  </section>;
}

