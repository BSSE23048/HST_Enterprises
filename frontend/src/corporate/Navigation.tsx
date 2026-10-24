import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { catalogueCategoryPages as categories, catalogueCategoryPath as categoryPath } from './catalogueCategories';

export function Brand({ light = false }: { light?: boolean }) {
  return <a className={`corporate-brand ${light ? 'light' : ''}`} href="/" aria-label="HST Enterprises home"><img src="/HST_logo.png" alt="" width="56" height="43"/><span>HST ENTERPRISES<small>POWER FOR YOUR TRUST</small></span></a>;
}
const links = [['Projects', '#projects'], ['Products', '/products'], ['About us', '#about'], ['Industries', '#industries'], ['Contact', '#contact']];
export default function Navigation({ homeLinks = false }: { homeLinks?: boolean }) {
  const hrefFor = (href: string) => homeLinks && href.startsWith('#') ? `/${href}` : href;
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const products = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (products.current && !products.current.contains(event.target as Node)) products.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && products.current?.open) {
        products.current.open = false;
        products.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button') || []);
    focusable()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (e.key === 'Tab') {
        const list = [toggle.current!, ...focusable()];
        if (e.shiftKey && document.activeElement === list[0]) { e.preventDefault(); list.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === list.at(-1)) { e.preventDefault(); list[0]?.focus(); }
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeDesktop);
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); desktop.removeEventListener('change', closeDesktop); };
  }, [open]);
  return <header className="site-header">
    <div className="nav-inner"><Brand/><nav className="desktop-nav" aria-label="Main navigation"><details ref={products} className="products-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }}><summary>Categories <span aria-hidden="true">⌄</span></summary><div className="products-dropdown">{categories.map(category => <a key={category.slug} href={categoryPath(category)}>{category.name}<Icon name="arrow" size={15}/></a>)}</div></details>{links.map(([label, href]) => <a key={label} href={hrefFor(href)}>{label}</a>)}</nav>
      <div className="nav-actions"><a href="/portal" className="portal-link"><Icon name="portal" size={15}/> Employee portal</a><a href={hrefFor("#contact")} className="nav-cta">Let’s talk <Icon name="diagonal" size={17}/></a></div>
      <button ref={toggle} className="mobile-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'}/></button>
    </div>
    {open && <nav ref={panel} id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href], i) => <a key={label} href={hrefFor(href)} onClick={() => { setOpen(false); requestAnimationFrame(() => { const target = homeLinks || !href.startsWith('#') ? null : document.querySelector<HTMLElement>(href); target?.focus({ preventScroll: true }); }); }}><span>0{i+1}</span>{label}<Icon name="diagonal"/></a>)}<section className="mobile-products" aria-labelledby="mobile-products-title"><h2 id="mobile-products-title">Products</h2>{categories.map(category => <a key={category.slug} href={categoryPath(category)} onClick={() => setOpen(false)}>{category.name}<Icon name="arrow" size={17}/></a>)}</section><a className="mobile-portal" href="/portal"><Icon name="portal"/>Employee portal<Icon name="arrow"/></a><p>Industrial expertise. A personal approach.<br/>Lahore, Pakistan.</p></nav>}
  </header>;
}
