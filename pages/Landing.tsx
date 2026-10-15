import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, Loader2, MapPin, ShoppingBag, Star, Store, Truck, User as UserIcon, Wrench } from 'lucide-react';
import { AppSection, Product, ServiceProvider, User, UserRole } from '../types';
import { SafeImage } from '../components/ui';
import { api } from '../services/data';
import { routeForPath } from '../config/seo';
import {
  AREAS, JOIN_PAGES, LANDING_CITY, MART_CATEGORIES, SERVICES,
  landingForPath, martPagePath, serviceAreaPath, servicePagePath, withArticle,
  type AreaDef, type JoinRole, type LandingPage,
} from '../config/landing';
import { applyHeadForRoute } from '../services/seoHead';
import { setFixitCategoryIntent, setMartCategoryIntent } from '../services/navIntent';

interface LandingProps {
  path: string;
  navigateTo: (section: AppSection, path?: string) => void;
  user: User | null;
  setAuthIntent: (intent: { section: AppSection; role: UserRole } | null) => void;
  refreshUser?: () => void;
}

const ROLE_SECTION: Record<JoinRole, AppSection> = { VENDOR: AppSection.MART, PROVIDER: AppSection.FIXIT, RIDER: AppSection.RIDE };
const ROLE_NAME: Record<JoinRole, string> = { VENDOR: 'vendor', PROVIDER: 'artisan', RIDER: 'rider' };

const matchesArea = (text: string | undefined, area: AreaDef) =>
  !!text && area.match.some(m => text.toLowerCase().includes(m));

/** A real link (crawlable, opens in a new tab with ctrl/cmd) that stays in the app on a plain click. */
const PageLink: React.FC<{ to: string; go: (path: string) => void; className?: string; children: React.ReactNode }> = ({ to, go, className, children }) => (
  <a
    href={to}
    className={className}
    onClick={e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(to);
    }}
  >
    {children}
  </a>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="font-display text-xl md:text-2xl font-bold text-kubwa-ink mb-4">{title}</h2>
    {children}
  </section>
);

const Landing: React.FC<LandingProps> = ({ path, navigateTo, user, setAuthIntent, refreshUser }) => {
  const page = landingForPath(path) as LandingPage;
  const [cityId, setCityId] = useState<number | null | undefined>(undefined);
  const [providers, setProviders] = useState<ServiceProvider[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [joining, setJoining] = useState(false);

  const go = (to: string) => {
    const r = routeForPath(to);
    navigateTo(r.section, r.path);
  };

  useEffect(() => {
    api.locations.getCities().then(cities => {
      const city = cities.find(c => c.name.toLowerCase() === LANDING_CITY.toLowerCase());
      setCityId(city?.id ?? null);
    }).catch(() => setCityId(null));
  }, []);

  // Live listings for this page.
  useEffect(() => {
    setProviders(null);
    setProducts(null);
    if (!page || cityId === undefined) return;
    if (cityId === null) {
      if (page.service) setProviders([]);
      if (page.martCategory) setProducts([]);
      return;
    }
    const browse = { scope: 'CITY' as const, cityId, label: LANDING_CITY };
    if (page.service) {
      api.getProviders(browse, 0)
        .then(({ items }) => setProviders(items.filter(p => p.category === page.service!.category)))
        .catch(() => setProviders([]));
    } else if (page.martCategory) {
      api.getProducts(browse, 0)
        .then(({ items }) => setProducts(items.filter(p => p.category === page.martCategory!.id)))
        .catch(() => setProducts([]));
    }
  }, [page?.path, cityId]);

  // Area pages: artisans whose address names the area first, then others in the same area council.
  const { inArea, nearby } = useMemo(() => {
    if (!providers || !page?.area) return { inArea: providers ?? [], nearby: [] as ServiceProvider[] };
    const area = page.area;
    const here = providers.filter(p => matchesArea(p.area, area) || matchesArea(p.location, area));
    const around = providers.filter(p => !here.includes(p) && p.lgaName === area.lga);
    return { inArea: here, nearby: around };
  }, [providers, page?.path]);

  // Keep empty area pages out of search results until an artisan lists there.
  useEffect(() => {
    if (!page?.hideFromSearchWhenEmpty || providers === null) return;
    applyHeadForRoute(routeForPath(page.path), inArea.length === 0);
  }, [providers, page?.path]);

  if (!page) return null;

  const openFixit = (category: string) => { setFixitCategoryIntent(category); navigateTo(AppSection.FIXIT); };
  const openMart = (category: string) => { setMartCategoryIntent(category); navigateTo(AppSection.MART); };

  const handleJoin = async (role: JoinRole) => {
    const section = ROLE_SECTION[role];
    if (!user) {
      setAuthIntent({ section, role });
      navigateTo(AppSection.ACCOUNT);
      return;
    }
    if (user.role === role) { navigateTo(section); return; }
    if (user.role !== 'USER') {
      alert(`Your account is already registered as a ${user.role.toLowerCase()}. Contact support if you'd like to change your account type.`);
      return;
    }
    if (!window.confirm(`Apply to join as a ${ROLE_NAME[role]}? Our team reviews every application before it goes live.`)) return;
    setJoining(true);
    const result = await api.auth.requestRoleUpgrade(role);
    setJoining(false);
    if (result.success) {
      alert("Your application is in. We'll let you know as soon as it's approved.");
      refreshUser?.();
    } else {
      alert(result.error || "Couldn't submit your application. Please try again.");
    }
  };

  const eyebrow = page.kind === 'mart' ? 'Mart' : page.kind === 'join' ? 'Join Sell Am Here' : page.kind === 'hub' ? LANDING_CITY : 'FixIt';
  const accent = page.kind === 'mart' ? 'text-kubwa-martText' : page.kind === 'join' || page.kind === 'hub' ? 'text-kubwa-primary' : 'text-kubwa-fixitText';
  const service = page.service;
  const area = page.area;

  const ProviderCard: React.FC<{ p: ServiceProvider }> = ({ p }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
        <SafeImage src={p.image} alt="" className="w-full h-full object-cover" fallbackIcon={<UserIcon size={20} />} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-kubwa-ink truncate flex items-center gap-1.5">
          {p.name}{p.isVerified && <BadgeCheck size={15} className="text-kubwa-ride shrink-0" aria-label="Verified" />}
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
          <MapPin size={12} /> {p.area || p.lgaName || LANDING_CITY}
        </p>
        <p className="text-xs text-gray-600 font-semibold mt-1 flex items-center gap-3">
          {p.rate ? <span>From ₦{Number(p.rate).toLocaleString()}</span> : null}
          {p.reviews ? <span className="flex items-center gap-1"><Star size={12} className="text-kubwa-amber fill-kubwa-amber" /> {Number(p.rating || 0).toFixed(1)} ({p.reviews})</span> : <span>New</span>}
        </p>
      </div>
      <button type="button" onClick={() => openFixit(p.category)} className="shrink-0 px-4 py-2.5 rounded-xl bg-kubwa-ink text-white text-xs font-bold hover:brightness-125">
        Book
      </button>
    </div>
  );

  const loading = (page.service && providers === null) || (page.martCategory && products === null);

  return (
    <div className="pb-24 pt-4 px-4 md:px-0 md:pt-8 md:pb-0 md:max-w-4xl md:mx-auto">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs font-bold text-gray-500 flex items-center gap-1.5 flex-wrap mb-6">
        <PageLink to="/" go={go} className="hover:text-kubwa-primary">Home</PageLink>
        {page.kind !== 'hub' && (<><ChevronRight size={12} /><PageLink to="/abuja" go={go} className="hover:text-kubwa-primary">Abuja</PageLink></>)}
        {page.kind === 'service-area' && service && (<><ChevronRight size={12} /><PageLink to={servicePagePath(service)} go={go} className="hover:text-kubwa-primary">{service.plural}</PageLink></>)}
        <ChevronRight size={12} /><span className="text-kubwa-ink">{area ? area.name : page.h1}</span>
      </nav>

      {/* Header */}
      <header className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-10 shadow-sm">
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accent}`}>{eyebrow}</p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-kubwa-ink leading-tight">{page.h1}</h1>
        <p className="mt-4 text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-2xl">{page.intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {service && (
            <button type="button" onClick={() => openFixit(service.category)} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kubwa-primary text-white text-sm font-bold hover:brightness-110">
              <Wrench size={16} /> Find {withArticle(service.singular)} <ArrowRight size={16} />
            </button>
          )}
          {page.martCategory && (
            <button type="button" onClick={() => openMart(page.martCategory!.id)} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kubwa-primary text-white text-sm font-bold hover:brightness-110">
              <ShoppingBag size={16} /> Shop {page.martCategory.label.toLowerCase()} <ArrowRight size={16} />
            </button>
          )}
          {page.join && (
            <button type="button" disabled={joining} onClick={() => handleJoin(page.join!.role)} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kubwa-primary text-white text-sm font-bold hover:brightness-110 disabled:opacity-60">
              {joining ? <Loader2 size={16} className="animate-spin" /> : <>{page.join.cta} <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </header>

      {/* Live artisans */}
      {service && (
        <Section title={area ? `${service.plural} in ${area.name}` : `${service.plural} available in ${LANDING_CITY}`}>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" /></div>
          ) : inArea.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">{inArea.map(p => <ProviderCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="font-bold text-sm text-kubwa-ink">No {service.plural.toLowerCase()} listed {area ? `in ${area.name}` : `in ${LANDING_CITY}`} yet.</p>
              <p className="text-sm text-gray-600 font-medium mt-1">New artisans join every week. {area ? `You can also book one from elsewhere in ${LANDING_CITY}.` : 'Check back soon.'}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                {area && <PageLink to={servicePagePath(service)} go={go} className="text-kubwa-primary hover:underline">See all {service.plural.toLowerCase()} in {LANDING_CITY}</PageLink>}
                <PageLink to="/artisan-jobs-in-abuja" go={go} className="text-kubwa-primary hover:underline">Are you {withArticle(service.singular)}? List your skills free</PageLink>
              </div>
            </div>
          )}
          {area && nearby.length > 0 && (
            <>
              <h3 className="font-bold text-sm text-kubwa-ink mt-6 mb-3">Also working nearby</h3>
              <div className="grid gap-3 md:grid-cols-2">{nearby.map(p => <ProviderCard key={p.id} p={p} />)}</div>
            </>
          )}
        </Section>
      )}

      {/* Live products */}
      {page.martCategory && (
        <Section title={`Latest ${page.martCategory.label.toLowerCase()} in ${LANDING_CITY}`}>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" /></div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 8).map(p => (
                <button key={p.id} type="button" onClick={() => openMart(p.category)} className="text-left group">
                  <div className="h-36 md:h-44 rounded-2xl overflow-hidden mb-2 bg-gray-100">
                    <SafeImage src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-xs font-bold text-kubwa-ink truncate">{p.name}</p>
                  <p className="text-sm font-bold text-kubwa-martText">₦{Number(p.price).toLocaleString()}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="font-bold text-sm text-kubwa-ink">No {page.martCategory.label.toLowerCase()} listed in {LANDING_CITY} yet.</p>
              <p className="text-sm text-gray-600 font-medium mt-1">Sellers are joining every week.</p>
              <PageLink to="/sell-online-in-abuja" go={go} className="inline-block mt-4 text-sm font-bold text-kubwa-primary hover:underline">Sell {page.martCategory.label.toLowerCase()}? Open a free shop</PageLink>
            </div>
          )}
        </Section>
      )}

      {/* Service details */}
      {service && (
        <>
          <Section title={`What ${service.plural.toLowerCase()} on Sell Am Here can help with`}>
            <ul className="flex flex-wrap gap-2">
              {service.jobs.map(j => <li key={j} className="px-4 py-2 rounded-full bg-kubwa-fixit/10 text-kubwa-fixitText text-xs font-bold">{j}</li>)}
            </ul>
          </Section>
          <Section title={`Tips for hiring ${withArticle(service.singular)}`}>
            <ul className="space-y-3">
              {service.tips.map(t => <li key={t} className="flex gap-3 text-sm text-gray-700 font-medium"><CheckCircle2 size={18} className="text-kubwa-mart shrink-0 mt-0.5" />{t}</li>)}
            </ul>
          </Section>
          <Section title="How booking works">
            <ol className="grid gap-3 md:grid-cols-3">
              {['Compare rates, reviews and Verified badges.', 'Send a booking request in the app.', 'Agree the price and scope, then pay the artisan directly.'].map((t, i) => (
                <li key={t} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <span className="w-8 h-8 rounded-full bg-kubwa-ink text-white text-xs font-bold flex items-center justify-center mb-3">{i + 1}</span>
                  <p className="text-sm font-semibold text-kubwa-ink">{t}</p>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}

      {/* Area links */}
      {service && area && (
        <Section title={`Areas near ${area.name}`}>
          <p className="text-sm text-gray-600 font-medium mb-4">{service.plural} who list in {area.name} often also work in {area.nearby.join(', ')}.</p>
          <div className="flex flex-wrap gap-2">
            {AREAS.filter(a => a.slug !== area.slug).map(a => (
              <PageLink key={a.slug} to={serviceAreaPath(service, a)} go={go} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-kubwa-ink hover:border-kubwa-primary">
                {service.plural} in {a.name}
              </PageLink>
            ))}
          </div>
        </Section>
      )}
      {service && area && (
        <Section title={`Other services in ${area.name}`}>
          <div className="flex flex-wrap gap-2">
            {SERVICES.filter(s => s.areaPages && s.slug !== service.slug).map(s => (
              <PageLink key={s.slug} to={serviceAreaPath(s, area)} go={go} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-kubwa-ink hover:border-kubwa-primary">
                {s.plural} in {area.name}
              </PageLink>
            ))}
          </div>
        </Section>
      )}
      {service && !area && service.areaPages && (
        <Section title={`${service.plural} by area`}>
          <div className="flex flex-wrap gap-2">
            {AREAS.map(a => (
              <PageLink key={a.slug} to={serviceAreaPath(service, a)} go={go} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-kubwa-ink hover:border-kubwa-primary">
                {service.plural} in {a.name}
              </PageLink>
            ))}
          </div>
        </Section>
      )}

      {/* Mart details */}
      {page.martCategory && (
        <>
          <Section title="Popular in this category">
            <ul className="flex flex-wrap gap-2">
              {page.martCategory.examples.map(x => <li key={x} className="px-4 py-2 rounded-full bg-kubwa-mart/10 text-kubwa-martText text-xs font-bold">{x}</li>)}
            </ul>
          </Section>
          <Section title="Shop other categories">
            <div className="flex flex-wrap gap-2">
              {MART_CATEGORIES.filter(c => c.slug !== page.martCategory!.slug).map(c => (
                <PageLink key={c.slug} to={martPagePath(c)} go={go} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-kubwa-ink hover:border-kubwa-primary">
                  {c.label} in {LANDING_CITY}
                </PageLink>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Join pages */}
      {page.join && (
        <>
          <Section title="What you get">
            <ul className="grid gap-3 md:grid-cols-2">
              {page.join.benefits.map(b => <li key={b} className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-kubwa-ink shadow-sm"><CheckCircle2 size={18} className="text-kubwa-mart shrink-0 mt-0.5" />{b}</li>)}
            </ul>
          </Section>
          <Section title="How to get started">
            <ol className="grid gap-3 md:grid-cols-4">
              {page.join.steps.map((t, i) => (
                <li key={t} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <span className="w-8 h-8 rounded-full bg-kubwa-ink text-white text-xs font-bold flex items-center justify-center mb-3">{i + 1}</span>
                  <p className="text-sm font-semibold text-kubwa-ink">{t}</p>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}

      {/* Hub */}
      {page.kind === 'hub' && (
        <>
          <Section title="Hire an artisan in Abuja">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {SERVICES.map(s => (
                <PageLink key={s.slug} to={servicePagePath(s)} go={go} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold text-kubwa-ink hover:border-kubwa-fixit shadow-sm">
                  <Wrench size={16} className="text-kubwa-fixitText" /> {s.plural}
                </PageLink>
              ))}
            </div>
          </Section>
          <Section title="Artisans by area">
            <div className="grid gap-6 md:grid-cols-3">
              {AREAS.map(a => (
                <div key={a.slug}>
                  <h3 className="font-bold text-sm text-kubwa-ink mb-2 flex items-center gap-1.5"><MapPin size={14} className="text-kubwa-primary" /> {a.name}</h3>
                  <ul className="space-y-1.5">
                    {SERVICES.filter(s => s.areaPages).map(s => (
                      <li key={s.slug}><PageLink to={serviceAreaPath(s, a)} go={go} className="text-sm text-gray-600 font-medium hover:text-kubwa-primary hover:underline">{s.plural} in {a.name}</PageLink></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Shop in Abuja">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {MART_CATEGORIES.map(c => (
                <PageLink key={c.slug} to={martPagePath(c)} go={go} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold text-kubwa-ink hover:border-kubwa-mart shadow-sm">
                  <ShoppingBag size={16} className="text-kubwa-martText" /> {c.label}
                </PageLink>
              ))}
            </div>
          </Section>
          <Section title="Work with Sell Am Here">
            <div className="grid gap-2 md:grid-cols-3">
              {JOIN_PAGES.map(j => (
                <PageLink key={j.slug} to={`/${j.slug}`} go={go} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold text-kubwa-ink hover:border-kubwa-primary shadow-sm">
                  {j.role === 'VENDOR' ? <Store size={16} className="text-kubwa-primary" /> : j.role === 'RIDER' ? <Truck size={16} className="text-kubwa-primary" /> : <Wrench size={16} className="text-kubwa-primary" />}
                  {j.h1}
                </PageLink>
              ))}
            </div>
          </Section>
        </>
      )}

      {page.kind !== 'hub' && (
        <p className="mt-12 text-sm font-semibold text-gray-600">
          More in Abuja: <PageLink to="/abuja" go={go} className="text-kubwa-primary hover:underline">see every service, area and category</PageLink>
        </p>
      )}
    </div>
  );
};

export default Landing;
