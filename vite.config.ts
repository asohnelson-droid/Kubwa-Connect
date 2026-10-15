import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { ROUTES, SITE_URL, canonicalUrl, jsonLdFor, landingRoute, type RouteMeta } from './config/seo';
import { AREAS, JOIN_PAGES, LANDING_PAGES, MART_CATEGORIES, SERVICES, martPagePath, serviceAreaPath, servicePagePath, withArticle, type LandingPage } from './config/landing';
import { FAQ_ITEMS } from './config/faq';
import { AppSection } from './types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Swap one tag's attribute value, matched by a fixed marker in index.html. */
function setAttr(html: string, tagPattern: RegExp, value: string): string {
  if (!tagPattern.test(html)) throw new Error(`seo-pages: index.html is missing ${tagPattern}`);
  return html.replace(tagPattern, (tag) => tag.replace(/(content|href)="[^"]*"/, `$1="${esc(value)}"`));
}

const list = (items: string[]) => `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
const linkList = (items: { href: string; label: string }[]) => `<ul>${items.map(i => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join('')}</ul>`;

/** The written part of a landing page, for crawlers and link previews. Live listings load in the app. */
function landingExtra(lp: LandingPage): string {
  const h2 = (t: string) => `<h2 style="font-size:20px;margin:28px 0 8px">${esc(t)}</h2>`;
  let out = '';
  if (lp.service) {
    const s = lp.service;
    out += h2(`What ${s.plural.toLowerCase()} on Sell Am Here can help with`) + list(s.jobs);
    out += h2(`Tips for hiring ${withArticle(s.singular)}`) + list(s.tips);
    out += h2('How booking works') + list(['Compare rates, reviews and Verified badges.', 'Send a booking request in the app.', 'Agree the price and scope, then pay the artisan directly.']);
    if (lp.area) {
      const a = lp.area;
      out += h2(`Areas near ${a.name}`) + `<p>${esc(`${s.plural} who list in ${a.name} often also work in ${a.nearby.join(', ')}.`)}</p>`;
      out += linkList(AREAS.filter(x => x.slug !== a.slug).map(x => ({ href: serviceAreaPath(s, x), label: `${s.plural} in ${x.name}` })));
      out += h2(`Other services in ${a.name}`) + linkList(SERVICES.filter(x => x.areaPages && x.slug !== s.slug).map(x => ({ href: serviceAreaPath(x, a), label: `${x.plural} in ${a.name}` })));
      out += `<p><a href="${servicePagePath(s)}">${esc(`All ${s.plural.toLowerCase()} in Abuja`)}</a></p>`;
    } else if (s.areaPages) {
      out += h2(`${s.plural} by area`) + linkList(AREAS.map(a => ({ href: serviceAreaPath(s, a), label: `${s.plural} in ${a.name}` })));
    }
  }
  if (lp.martCategory) {
    const c = lp.martCategory;
    out += h2('Popular in this category') + list(c.examples);
    out += h2('Shop other categories') + linkList(MART_CATEGORIES.filter(x => x.slug !== c.slug).map(x => ({ href: martPagePath(x), label: `${x.label} in Abuja` })));
  }
  if (lp.join) {
    out += h2('What you get') + list(lp.join.benefits) + h2('How to get started') + list(lp.join.steps);
  }
  if (lp.kind === 'hub') {
    out += h2('Hire an artisan in Abuja') + linkList(SERVICES.map(s => ({ href: servicePagePath(s), label: `${s.plural} in Abuja` })));
    for (const a of AREAS) out += h2(`Artisans in ${a.name}`) + linkList(SERVICES.filter(s => s.areaPages).map(s => ({ href: serviceAreaPath(s, a), label: `${s.plural} in ${a.name}` })));
    out += h2('Shop in Abuja') + linkList(MART_CATEGORIES.map(c => ({ href: martPagePath(c), label: `${c.label} in Abuja` })));
    out += h2('Work with Sell Am Here') + linkList(JOIN_PAGES.map(j => ({ href: `/${j.slug}`, label: j.h1 })));
  } else {
    out += `<p style="margin-top:28px"><a href="/abuja">Sell Am Here in Abuja: every service, area and category</a></p>`;
  }
  return out;
}

/** Readable content for crawlers and link previews, replaced by the app as soon as it loads. */
function fallbackBody(r: RouteMeta, extra = ''): string {
  const links = ROUTES.filter(x => x.index)
    .map(x => `<li><a href="${x.path}">${esc(x.h1)}</a></li>`)
    .join('');
  const faq = r.section === AppSection.FAQ
    ? FAQ_ITEMS.map(f => `<h2 style="font-size:18px;margin:24px 0 6px">${esc(f.q)}</h2><p style="margin:0">${esc(f.a)}</p>`).join('')
    : '';
  return `<main style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:Inter,Arial,sans-serif;color:#161A2B;line-height:1.5">`
    + `<p style="font-weight:700;margin:0 0 24px">Sell Am Here</p>`
    + `<h1 style="font-size:32px;line-height:1.2;margin:0 0 12px">${esc(r.h1)}</h1>`
    + (r.intro ? `<p style="margin:0">${esc(r.intro)}</p>` : '')
    + faq
    + extra
    + `<nav aria-label="Pages" style="margin-top:32px"><ul style="padding-left:20px">${links}</ul></nav>`
    + `</main>`;
}

function pageHtml(template: string, r: RouteMeta, overrides?: { title?: string; noindex?: boolean; h1?: string; intro?: string }, extra = ''): string {
  const title = overrides?.title ?? r.title;
  const robots = overrides?.noindex || !r.index ? 'noindex, nofollow' : 'index, follow';
  const url = canonicalUrl(r);
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setAttr(html, /<meta name="description" content="[^"]*">/, r.description);
  html = setAttr(html, /<meta name="robots" content="[^"]*">/, robots);
  html = setAttr(html, /<link rel="canonical" href="[^"]*">/, url);
  html = setAttr(html, /<meta property="og:title" content="[^"]*">/, title);
  html = setAttr(html, /<meta property="og:description" content="[^"]*">/, r.description);
  html = setAttr(html, /<meta property="og:url" content="[^"]*">/, url);
  html = setAttr(html, /<meta name="twitter:title" content="[^"]*">/, title);
  html = setAttr(html, /<meta name="twitter:description" content="[^"]*">/, r.description);
  const ld = overrides ? [] : jsonLdFor(r);
  if (ld.length) {
    const scripts = ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n    ');
    html = html.replace('</head>', `    ${scripts}\n  </head>`);
  }
  const body = fallbackBody({ ...r, h1: overrides?.h1 ?? r.h1, intro: overrides?.intro ?? r.intro }, extra);
  if (!html.includes('<div id="root"></div>')) throw new Error('seo-pages: index.html is missing <div id="root"></div>');
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

/**
 * After the build, write one HTML file per page (mart.html, fixit.html, ...)
 * with that page's own title, description, canonical link and readable
 * content, plus sitemap.xml and a 404 page. Vercel serves /mart from
 * mart.html because vercel.json sets cleanUrls.
 */
function seoPages(): Plugin {
  let outDir = 'dist';
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir); },
    closeBundle() {
      const indexFile = path.join(outDir, 'index.html');
      const template = fs.readFileSync(indexFile, 'utf8');
      for (const r of ROUTES) {
        const file = r.path === '/' ? 'index.html' : `${r.path.slice(1)}.html`;
        fs.writeFileSync(path.join(outDir, file), pageHtml(template, r));
      }
      for (const lp of LANDING_PAGES) {
        const file = path.join(outDir, `${lp.path.slice(1)}.html`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, pageHtml(template, landingRoute(lp), undefined, landingExtra(lp)));
      }
      const home = ROUTES[0];
      fs.writeFileSync(path.join(outDir, '404.html'), pageHtml(template, home, {
        title: 'Page not found | Sell Am Here', noindex: true,
        h1: 'Page not found', intro: 'That page does not exist. Try one of the pages below.',
      }));
      const today = new Date().toISOString().slice(0, 10);
      // Area pages are left out: they stay hidden from search until an artisan lists there,
      // and search engines still reach them through the Abuja and service pages.
      const listed = [...ROUTES.filter(r => r.index), ...LANDING_PAGES.filter(lp => !lp.hideFromSearchWhenEmpty).map(landingRoute)];
      const urls = listed.map(r =>
        `  <url><loc>${canonicalUrl(r)}</loc><lastmod>${today}</lastmod><priority>${r.priority.toFixed(1)}</priority></url>`).join('\n');
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
      // eslint-disable-next-line no-console
      console.log(`seo-pages: wrote ${ROUTES.length + LANDING_PAGES.length} pages (${listed.length} in the sitemap), 404.html and sitemap.xml for ${SITE_URL}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPages()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
