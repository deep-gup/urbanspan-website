import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Truck, Factory, MapPin, Clock, ArrowRight, 
  ChevronRight, CheckCircle2, HelpCircle, Send, FileText, Layers, 
  Info, Phone, Mail, Sparkles, Navigation, ExternalLink, ChevronDown, ChevronUp, Award,
  ShoppingBag, Check, Search, ArrowUpRight, CheckSquare, Landmark, HardHat
} from 'lucide-react';
import SEO from '../SEO';
import DynamicForm from '../DynamicForm';
import { mpLocations } from '../../data/mpLocationsData';
import { fetchSteelProducts } from '../../services/headlessApi';
import { useCart } from '../../context/CartContext';
import { getProductUnit, getUnitRateLabel } from '../../utils/productUtils';

export default function LocationHubPage({ onSelectProductForInquiry, customerUser }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProductForRfq, setSelectedProductForRfq] = useState(null);
  const [addedCartId, setAddedCartId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        setProductsLoading(true);
        const data = await fetchSteelProducts();
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load steel products for location page:', err);
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { isMounted = false; };
  }, []);

  const location = useMemo(() => {
    return mpLocations.find(loc => loc.slug === slug || loc.city.toLowerCase() === (slug || '').toLowerCase());
  }, [slug]);

  const otherLocations = useMemo(() => {
    return mpLocations.filter(loc => loc.slug !== location?.slug);
  }, [location]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 25);
    setAddedCartId(product.id);
    setTimeout(() => {
      setAddedCartId(null);
    }, 2000);
  };

  const handleInquireProduct = (product) => {
    setSelectedProductForRfq(product);
    if (typeof onSelectProductForInquiry === 'function') {
      onSelectProductForInquiry(product);
    }
    const rfqEl = document.getElementById('rfq-section');
    if (rfqEl) {
      rfqEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!location) {
    return (
      <div className="py-32 max-w-4xl mx-auto px-4 text-center">
        <SEO 
          title="Location Not Found | Urbanspan Infrastructure"
          description="The requested regional steel supply hub was not found. Browse all Madhya Pradesh steel distribution centers."
        />
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Regional Hub Not Found</h1>
        <p className="text-slate-500 mb-6">Explore our primary steel distribution hubs across Madhya Pradesh.</p>
        <Link 
          to="/locations" 
          className="px-6 py-3 rounded-xl bg-brand-steel text-white font-bold hover:bg-brand-steel-dark transition-colors inline-block"
        >
          View All MP Regional Hubs
        </Link>
      </div>
    );
  }

  const locationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `https://urbanspaninfra.co.in/locations/${location.slug}#service`,
        "name": `Primary Steel & Fe-550D TMT Distribution in ${location.city}`,
        "serviceType": "Steel Distribution & Warehousing",
        "provider": {
          "@type": "LocalBusiness",
          "name": "Urbanspan Infrastructure Private Limited",
          "telephone": "+91-94259-22225",
          "email": "support@urbanspaninfra.co.in",
          "url": "https://urbanspaninfra.co.in",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Indore",
            "addressRegion": "Madhya Pradesh",
            "postalCode": "452009",
            "addressCountry": "IN"
          }
        },
        "areaServed": {
          "@type": "City",
          "name": location.city,
          "containedInPlace": {
            "@type": "AdministrativeArea",
            "name": "Madhya Pradesh"
          }
        },
        "description": location.subheadline
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://urbanspaninfra.co.in/locations/${location.slug}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://urbanspaninfra.co.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "MP Regional Hubs",
            "item": "https://urbanspaninfra.co.in/locations"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": location.city,
            "item": `https://urbanspaninfra.co.in/locations/${location.slug}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `https://urbanspaninfra.co.in/locations/${location.slug}#faq`,
        "mainEntity": (location.faqs || []).map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }
    ]
  };

  const rfqCityDefaults = {
    delivery_destination: `${location.city}, Madhya Pradesh`,
    notes: `Commercial steel supply inquiry for ${location.city}, Madhya Pradesh project site. Approved tender / project allocation.`,
    ...(selectedProductForRfq ? {
      product_id: selectedProductForRfq.id,
      product_name: selectedProductForRfq.name,
      sku: selectedProductForRfq.sku,
      benchmark_rate: selectedProductForRfq.base_price,
      unit: getProductUnit(selectedProductForRfq)
    } : {}),
    ...(customerUser ? { name: customerUser.name, email: customerUser.email, company: customerUser.company, phone: customerUser.phone } : {})
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title={location.metaTitle}
        description={location.metaDescription}
        keywords={location.keywords}
        url={`https://urbanspaninfra.co.in/locations/${location.slug}`}
        structuredData={locationSchema}
      />

      {/* Hero Location Banner */}
      <section className="bg-brand-navy-dark text-white pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-steel-dark/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link to="/locations" className="hover:text-white transition-colors">MP Regional Hubs</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-brand-steel-light font-bold">{location.city}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-steel/15 text-brand-steel-light border border-brand-steel/30 text-xs font-bold mb-4 shadow-sm">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>{location.dispatchTime}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4">
                {location.headline}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light mb-8 max-w-3xl">
                {location.subheadline}
              </p>

              {/* Badges / Metrics Strip (Emphasizing Swift Delivery & Bulk Material Capability) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Bulk Supply SLA</span>
                  <span className="text-sm font-bold text-white mt-1 block">{location.deliverySLA || 'Express Project Site Dispatch'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">BIS Certification</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">IS 1786 / IS 2062</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Weighbridge Slip</span>
                  <span className="text-sm font-bold text-brand-steel-light mt-1 block">100% Computerized</span>
                </div>
              </div>
            </div>

            {/* Quick Quote Card */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-slate-900 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{location.city} Project Sourcing Desk</h3>
                  <p className="text-xs text-slate-300">Govt &amp; EPC Tender Allocation</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Direct primary mill allocation, trailer bookings, and NABL test certificates for project sites in {location.city}. Reach out to sales engineers today.
              </p>
              <div className="space-y-3">
                <a
                  href="#rfq-section"
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-steel hover:bg-brand-steel-dark text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <span>Request {location.city} Rate Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+919425922225"
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call 094259 22225</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Target Industrial Sectors & Approved Depts Strip */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold text-brand-steel uppercase tracking-wider block">
                Target Industries &amp; Projects Served in {location.city}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Specialized Sourcing for {location.regionName}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(location.keySectors || []).map((sector, sIdx) => (
                <span 
                  key={sIdx}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-steel shrink-0" />
                  <span>{sector}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Government Department Approved Steel & Ongoing Mega-Projects Showcase */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-3">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" /> Govt. Department Approved Sourcing &amp; Compliance
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tender Approved Steel for {location.city} Public &amp; Infra Projects
            </h2>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              100% Primary Blast Furnace Fe-550D TMT rebars (IS 1786:2008) and IS 2062 Structural Steel complying with strict technical specifications, approved vendor lists (AVL), and NABL test certifications.
            </p>
          </div>

          {/* Department Badges Row */}
          {location.approvedDepts && location.approvedDepts.length > 0 && (
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl mb-10 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Approved Vendor Standards</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Compliant with Public Works &amp; Transport Authorities</h3>
                </div>
                <span className="text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full self-start md:self-auto">
                  Primary Producers (SAIL • Jindal Panther • RINL)
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {location.approvedDepts.map((dept, dIdx) => (
                  <span 
                    key={dIdx}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{dept}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ongoing Infrastructure Projects in this City */}
          {location.ongoingProjects && location.ongoingProjects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <HardHat className="w-5 h-5 text-brand-steel" /> Key Ongoing Infrastructure &amp; Public Works in {location.city}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {location.ongoingProjects.map((proj, pIdx) => (
                  <div 
                    key={pIdx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-brand-steel/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {proj.name}
                        </h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase shrink-0 border border-emerald-200">
                          Active Supply
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {proj.role}
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Standard: IS 1786 / IS 2062</span>
                      <span className="text-brand-steel font-bold">MTC Included ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Key Supply Highlights */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Why Contractors in {location.city} Choose Urbanspan
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            From single trailer stockyard dispatches to multi-thousand-ton blast furnace allocations, we power infrastructure across {location.city} with transparency, test certificates, and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(location.highlights || []).map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-steel/10 text-brand-steel flex items-center justify-center mb-6">
                  {idx === 0 ? <Truck className="w-6 h-6" /> : idx === 1 ? <Factory className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Steel Product Catalogue Available for City */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-steel/10 text-brand-steel text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Certified Mill Inventory
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Steel Products &amp; Fe-550D TMT Supply for {location.city}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Immediate stockyard dispatch and direct mill rake bookings available across all {location.city} project sites.
              </p>
            </div>
            <Link 
              to="/products"
              className="text-xs sm:text-sm font-bold text-brand-steel hover:text-brand-steel-dark flex items-center gap-1.5 self-start md:self-auto bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
            >
              <span>Explore Complete Product Catalogue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((prod) => {
                const unit = getProductUnit(prod);
                const rateLabel = getUnitRateLabel(prod);
                const priceFormatted = Number(prod.base_price) > 0 ? `₹${Number(prod.base_price).toLocaleString('en-IN')}` : 'Spot Price';

                return (
                  <div 
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group hover:border-brand-steel/40"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="h-44 overflow-hidden bg-slate-100 relative">
                        {prod.image_url ? (
                          <img 
                            src={prod.image_url} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <Factory className="w-12 h-12" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                          {prod.category || 'Steel Rebar'}
                        </span>
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-xs">
                          {priceFormatted} {rateLabel}
                        </span>
                      </div>

                      {/* Product Details */}
                      <div className="p-5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-brand-steel mb-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>BIS IS 1786 / IS 2062</span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-brand-steel transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
                          {prod.description || 'High tensile primary steel supply with complete NABL test certificates.'}
                        </p>
                        
                        {/* Specs badge */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            SKU: {prod.sku}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">
                            Ready in Stockyard
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="p-5 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/products/${prod.id}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Specs</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(prod, e)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
                            addedCartId === prod.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-brand-navy hover:bg-brand-navy-dark text-white'
                          }`}
                        >
                          {addedCartId === prod.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add Cart</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInquireProduct(prod)}
                        className="w-full py-2.5 px-3 rounded-xl bg-brand-steel hover:bg-brand-steel-dark text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Inquire for {location.city} ➔</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Embedded Location RFQ Form Section */}
      <section id="rfq-section" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-steel/10 text-brand-steel text-xs font-bold mb-2">
              <MapPin className="w-3.5 h-3.5" /> {location.city} Regional Sourcing Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Commercial Steel RFQ — {location.city} Project Allocation
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
              Submit your tonnage requirement, steel grades, and project delivery site in {location.city} for immediate rate quote dispatch.
            </p>
          </div>

          <DynamicForm 
            formName="lead_capture"
            title={`Commercial Steel RFQ — ${location.city}`}
            subtitle={`Direct primary steel allocation and freight rate calculation for ${location.city}.`}
            icon={Factory}
            isPageHeading={false}
            defaultValues={rfqCityDefaults}
            customerUser={customerUser}
          />
        </div>
      </section>

      {/* Location Specific FAQ Accordion */}
      {location.faqs && location.faqs.length > 0 && (
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Frequently Asked Questions — {location.city} Steel Supply
            </h2>
            <p className="text-slate-500 text-sm">Common inquiries regarding tender compliance, freight SLAs, and billing in {location.city}.</p>
          </div>

          <div className="space-y-3">
            {location.faqs.map((faq, fIdx) => (
              <div 
                key={fIdx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-brand-steel transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-brand-steel shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {openFaqIndex === fIdx ? (
                    <ChevronUp className="w-4 h-4 text-brand-steel shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaqIndex === fIdx && (
                  <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cross-linking Grid for all other MP Cities (Internal Link Equity) */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-steel" /> Other Madhya Pradesh Steel Distribution Hubs
            </h3>
            <Link to="/locations" className="text-xs font-bold text-brand-steel hover:underline">
              View All Locations Directory →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {otherLocations.map((otherLoc) => (
              <Link
                key={otherLoc.slug}
                to={`/locations/${otherLoc.slug}`}
                className="p-3.5 bg-white hover:bg-brand-steel/5 rounded-xl border border-slate-200 hover:border-brand-steel/40 text-xs transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="font-extrabold text-slate-900 group-hover:text-brand-steel mb-1 flex items-center justify-between">
                  <span>{otherLoc.city}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-steel group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{(otherLoc.dispatchTime || '').split('(')[0] || 'Swift Project Transit'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
