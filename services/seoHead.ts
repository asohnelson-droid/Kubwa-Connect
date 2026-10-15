import { AppSection } from '../types';
import { canonicalUrl, routeForSection, type RouteMeta } from '../config/seo';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Keeps the tab title, description, canonical link and share tags in step with the page on screen. */
export function applyHeadForSection(section: AppSection) {
  applyHeadForRoute(routeForSection(section));
}

/** `hide` keeps a page out of search results (used for area pages with no listings yet). */
export function applyHeadForRoute(r: RouteMeta, hide = false) {
  const url = canonicalUrl(r);
  document.title = r.title;
  setMeta('name', 'description', r.description);
  setMeta('name', 'robots', r.index && !hide ? 'index, follow' : 'noindex, follow');
  setCanonical(url);
  setMeta('property', 'og:title', r.title);
  setMeta('property', 'og:description', r.description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', r.title);
  setMeta('name', 'twitter:description', r.description);
}
