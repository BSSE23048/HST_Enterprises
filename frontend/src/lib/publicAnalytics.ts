import { publicPages, siteUrl } from '../seo';
import './publicAnalytics.css';

const measurementId = 'G-84JPTSFMGZ';
const storageKey = 'hst.analytics-consent.v1';
const maxAge = 180 * 24 * 60 * 60 * 1000;
type Choice = 'accepted' | 'declined';
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  'ga-disable-G-84JPTSFMGZ'?: boolean;
};
const analyticsWindow = window as AnalyticsWindow;
const page = publicPages.find(item => (item.path.replace(/\/+$/, '') || '/') === (location.pathname.replace(/\/+$/, '') || '/'));
let choice: Choice | null = null;
let initialized = false;
let pageViewSent = false;

function storedChoice(): Choice | null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (value && (value.choice === 'accepted' || value.choice === 'declined') &&
      typeof value.time === 'number' && value.time <= Date.now() && Date.now() - value.time < maxAge) return value.choice;
  } catch { /* Storage may be unavailable. Default to no analytics. */ }
  return null;
}

function disable() {
  analyticsWindow['ga-disable-G-84JPTSFMGZ'] = true;
  // This integration uses host-only cookies on the root path.
  for (const name of ['_ga', '_ga_84JPTSFMGZ']) {
    try { document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`; } catch { /* Cookie access can be blocked by the browser. */ }
  }
}

function start() {
  if (!page || choice !== 'accepted' || initialized) return;
  // Do not compete with a tag introduced by another integration.
  if (analyticsWindow.gtag || document.querySelector('script[src*="googletagmanager.com/"]')) return;
  initialized = true;
  analyticsWindow['ga-disable-G-84JPTSFMGZ'] = false;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = function () { analyticsWindow.dataLayer!.push(arguments); };
  const gtag = analyticsWindow.gtag;
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('set', 'ads_data_redaction', true);
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'none',
    cookie_flags: 'SameSite=Lax;Secure',
    page_location: siteUrl + page.path,
    page_title: page.title,
    page_referrer: '',
    ignore_referrer: true,
  });
  const script = document.createElement('script');
  script.id = 'hst-ga4';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.onload = () => {
    if (choice === 'accepted' && !pageViewSent) {
      pageViewSent = true;
      event('page_view', 'page');
    }
  };
  document.head.append(script);
}

function event(name: 'page_view' | 'whatsapp_click' | 'phone_click', location: string) {
  if (!page || choice !== 'accepted' || !initialized || analyticsWindow['ga-disable-G-84JPTSFMGZ']) return;
  analyticsWindow.gtag?.('event', name, {
    send_to: measurementId,
    page_path: page.path,
    page_location: siteUrl + page.path,
    page_title: page.title,
    page_referrer: '',
    button_location: location,
  });
}

function buttonLocation(element: Element): string {
  if (element.closest('#catalogue')) return 'product_catalogue';
  if (element.closest('.floating-whatsapp')) return 'floating_widget';
  if (element.closest('footer')) return 'footer';
  if (element.closest('.site-header, .utility-bar')) return 'header';
  if (element.closest('.enquiry-form')) return 'enquiry_form';
  if (element.closest('#contact')) return 'contact_section';
  if (element.closest('#projects')) return 'project_section';
  if (element.closest('.category-contact')) return 'category_contact';
  if (element.closest('.category-intro')) return 'category_header';
  return 'public_content';
}

export function initPublicAnalytics() {
  if (!page || document.getElementById('hst-analytics-preferences')) return;
  choice = storedChoice();
  const container = document.createElement('div');
  container.id = 'hst-analytics-preferences';
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'hst-analytics-settings';
  settings.textContent = 'Cookie settings';
  settings.setAttribute('aria-controls', 'hst-analytics-notice');
  const notice = document.createElement('section');
  notice.id = 'hst-analytics-notice';
  notice.className = 'hst-analytics-notice';
  notice.setAttribute('aria-labelledby', 'hst-analytics-title');
  const title = document.createElement('h2');
  title.id = 'hst-analytics-title';
  title.textContent = 'Optional analytics cookies';
  const explanation = document.createElement('p');
  explanation.textContent = 'With your permission, HST Enterprises uses Google Analytics to measure public page visits and contact-button clicks. We do not include enquiry text, contact details or ERP activity in these events. Google processes usage and device information. You can decline or withdraw permission here at any time.';
  const privacy = document.createElement('a');
  privacy.href = 'https://policies.google.com/privacy';
  privacy.target = '_blank';
  privacy.rel = 'noreferrer';
  privacy.textContent = 'Google privacy policy';
  const actions = document.createElement('div');
  actions.className = 'hst-analytics-actions';
  const show = (visible: boolean) => { notice.hidden = !visible; settings.setAttribute('aria-expanded', String(visible)); };
  const choose = (value: Choice) => {
    choice = value;
    try { localStorage.setItem(storageKey, JSON.stringify({ choice: value, time: Date.now() })); } catch { /* Choice lasts for this page only. */ }
    show(false);
    settings.focus();
    if (value === 'accepted') {
      if (initialized && analyticsWindow['ga-disable-G-84JPTSFMGZ']) location.reload();
      else start();
    } else disable();
  };
  for (const [label, value] of [['Decline analytics', 'declined'], ['Accept analytics', 'accepted']] as const) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => choose(value)); actions.append(button);
  }
  notice.append(title, explanation, privacy, actions);
  container.append(settings, notice);
  document.body.append(container);
  settings.addEventListener('click', () => { show(notice.hidden); if (!notice.hidden) actions.querySelector('button')?.focus(); });
  notice.addEventListener('keydown', e => { if (e.key === 'Escape') { show(false); settings.focus(); } });
  show(choice === null);
  if (choice === 'accepted') start(); else disable();
  // Delegation covers all public anchors, including dynamically prepared WhatsApp drafts.
  document.addEventListener('click', e => {
    const anchor = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const url = new URL(anchor.href);
    if (url.protocol === 'tel:') event('phone_click', buttonLocation(anchor));
    else if (url.protocol === 'https:' && url.hostname === 'wa.me') event('whatsapp_click', buttonLocation(anchor));
  }, true);
  document.addEventListener('submit', e => {
    if (e.target instanceof HTMLFormElement && e.target.matches('.enquiry-form') && e.target.checkValidity()) event('whatsapp_click', 'enquiry_form');
  }, true);
  window.addEventListener('storage', e => {
    if (e.key !== storageKey && e.key !== null) return;
    choice = storedChoice();
    if (choice !== 'accepted') { disable(); show(choice === null); }
    else if (initialized) location.reload();
    else { show(false); start(); }
  });
}
