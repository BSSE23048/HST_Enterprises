import { renderToString } from 'react-dom/server';
import { findCatalogueCategory } from './corporate/catalogueCategories';
import ProductsPage from './corporate/ProductsPage';
import CorporateSite from './corporate/CorporateSite';
import CategoryPage from './corporate/CategoryPage';
import { findCategory } from './corporate/categories';
export function render(path = '/') {
  const catalogueCategory = findCatalogueCategory(path);
  if (path === '/products' || catalogueCategory) return renderToString(<ProductsPage category={catalogueCategory}/>);
  const category = findCategory(path);
  if (path !== '/' && !category) throw new Error(`Unknown public path: ${path}`);
  return renderToString(category ? <CategoryPage category={category}/> : <CorporateSite />);
}
