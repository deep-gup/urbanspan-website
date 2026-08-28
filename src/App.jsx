import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailsPage from './components/ProductDetailsPage';
import CartPage from './components/CartPage';
import DynamicForm from './components/DynamicForm';
import ContactUs from './components/ContactUs';
import CustomerPortal from './components/CustomerPortal';
import LiveChatWidget from './components/LiveChatWidget';
import ApiConfigModal from './components/ApiConfigModal';
import MobileDashboard from './components/MobileDashboard';
import News from './components/News';
import NewsArticlePage from './components/NewsArticlePage';
import SEO from './components/SEO';
import LatestNewsPreview from './components/LatestNewsPreview';
import AppShowcase from './components/AppShowcase';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Building2, ShieldCheck, Factory, Send, Mail } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive activeTab from current route so Navbar/BottomTabBar still highlight correctly
  const path = location.pathname.toLowerCase();
  let activeTab = 'home';
  if (path.includes('about')) activeTab = 'about';
  else if (path.includes('products') || path.includes('catalog') || path.includes('product')) activeTab = 'products';
  else if (path.includes('contact')) activeTab = 'contact';
  else if (path.includes('rfq')) activeTab = 'rfq';
  else if (path.includes('news')) activeTab = 'news';
  else if (path.includes('portal')) activeTab = 'portal';
  else if (path.includes('chat')) activeTab = 'chat';
  else if (path.includes('cart')) activeTab = 'cart';

  const setActiveTab = (tab) => {
    let newPath = '/';
    if (tab === 'about') newPath = '/about-us';
    else if (tab === 'news') newPath = '/news';
    else if (tab !== 'home') newPath = `/${tab}`;
    navigate(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Google Analytics 4 route tracking for Single Page Application
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  }, [location.pathname, location.search]);

  const [appVersion, setAppVersion] = useState('v1.2.0');
  const [otaStatus, setOtaStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const checkOtaUpdate = async (manual = false) => {
    try {
      if (manual) setIsUpdating(true);
      if (Capacitor.isNativePlatform()) {
        const current = await CapacitorUpdater.current().catch(() => null);
        const activeVer = current?.bundle?.version || 'v1.1.0';
        setAppVersion(activeVer);

        const res = await fetch('https://api.urbanspaninfra.co.in/api/ota-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: 'com.urbanspan.app', version: activeVer })
        });
        const data = await res.json();

        if (data?.url && data?.version && data.version !== activeVer) {
          setOtaStatus(`Downloading update ${data.version}...`);
          const bundle = await CapacitorUpdater.download({
            url: data.url,
            version: data.version
          });
          await CapacitorUpdater.set({ id: bundle.version || data.version });
          setOtaStatus('Update installed! Reloading app...');
          setTimeout(() => {
            CapacitorUpdater.reload();
          }, 1000);
        } else {
          if (manual) {
            alert(`App is already on the latest version (${activeVer})`);
          }
        }
      } else {
        if (manual) {
          alert('You are running the latest live web build (v1.2.0).');
        }
      }
    } catch (err) {
      console.warn('OTA check error:', err);
      if (manual) alert('Could not complete update check: ' + (err.message || err));
    } finally {
      if (manual) setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady().catch(console.error);
      checkOtaUpdate(false);
    }
  }, []);

  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('urbanspan_customer_user');
    if (storedUser) {
      try { setCustomerUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  const handleProductInquiry = (product) => {
    setSelectedProductForInquiry(product);
    navigate('/rfq');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rfqDefaults = {};
  if (selectedProductForInquiry) {
    rfqDefaults.product_id = selectedProductForInquiry.id;
    rfqDefaults.product_name = selectedProductForInquiry.name;
    rfqDefaults.sku = selectedProductForInquiry.sku;
    rfqDefaults.base_price = selectedProductForInquiry.base_price;
    rfqDefaults.unit = selectedProductForInquiry.unit || 'ton';
    rfqDefaults.quantity = 50;
    rfqDefaults.notes = `Commercial bulk procurement inquiry for ${selectedProductForInquiry.name}.`;
    rfqDefaults.preselectedProduct = selectedProductForInquiry;
  }
  if (customerUser) {
    rfqDefaults.name = customerUser.name;
    rfqDefaults.email = customerUser.email;
    rfqDefaults.company = customerUser.company;
    rfqDefaults.phone = customerUser.phone;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-brand-steel selection:text-white">
        
        {/* Navbar Header (Hidden on Mobile App) */}
        {!isMobile && (
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenConfig={() => setIsConfigOpen(true)}
            customerUser={customerUser}
            onOpenAuthModal={() => {
              setActiveTab('portal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      {/* Mobile Top Header */}
      {isMobile && (
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-slate-200">
          <Link to="/" className="flex flex-col items-start gap-0.5 cursor-pointer">
            <img src="/urbanspan-logo-cropped.png" alt="Urbanspan Logo" className="h-8 sm:h-10 w-auto object-contain mix-blend-multiply origin-left" />
            <p className="font-tagline italic text-[10px] text-brand-navy font-semibold tracking-wider ml-1 mt-0.5">Reinforcing your Dreams</p>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rfq')}
              className="px-3 py-1.5 bg-brand-steel hover:bg-brand-steel-dark text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all"
            >
              Get Quote
            </button>
            <Link
              to="/portal"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-brand-navy text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{customerUser ? customerUser.name.split(' ')[0] : 'Portal'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Pages */}
      <main className="flex-1 pb-16 lg:pb-0">
        <ErrorBoundary>
          <Routes>
          <Route path="/" element={
            isMobile ? (
              <>
                <SEO title="Home" />
                <MobileDashboard 
                  customerUser={customerUser} 
                  onNavigate={setActiveTab} 
                  appVersion={appVersion}
                  onCheckUpdate={() => checkOtaUpdate(true)}
                  isUpdating={isUpdating}
                  otaStatus={otaStatus}
                />
              </>
            ) : (
              <>
                <SEO title="Home" />
                <Hero
                  onExploreCatalog={() => setActiveTab('products')}
                  onPartnerInquiry={() => setActiveTab('rfq')}
                />
                <LatestNewsPreview />
                <AppShowcase />
                <ProductCatalog onSelectProductForInquiry={handleProductInquiry} />
                <div className="bg-white py-12 border-t border-slate-200">
                  <DynamicForm 
                    formName="lead_capture" 
                    title="Commercial Steel RFQ Submission" 
                    subtitle="Submit your bulk tonnage, grade specifications, and delivery destination below for instant quote dispatch by Urbanspan sales engineers." 
                    icon={Factory}
                    defaultValues={rfqDefaults}
                    customerUser={customerUser}
                  />
                </div>
              </>
            )
          } />

          <Route path="/about-us" element={
            <div className="pt-24">
              <SEO title="About Us" />
              <AboutUs />
            </div>
          } />

          <Route path="/products" element={
            <div className="pt-24">
              <SEO title="Product Catalog" />
              <ProductCatalog onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />

          <Route path="/catalog" element={
            <div className="pt-24">
              <SEO title="Product Catalog" />
              <ProductCatalog onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />

          <Route path="/products/:id" element={
            <div className="pt-24">
              <SEO title="Product Details" />
              <ProductDetailsPage onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />

          <Route path="/product/:id" element={
            <div className="pt-24">
              <SEO title="Product Details" />
              <ProductDetailsPage onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />

          <Route path="/rfq" element={
            <div className="pt-24 bg-white min-h-screen">
              <SEO title="Request a Quote" />
              <DynamicForm 
                formName="lead_capture" 
                title="Commercial Steel RFQ Submission" 
                subtitle="Submit your bulk tonnage, grade specifications, and delivery destination below for instant quote dispatch by Urbanspan sales engineers." 
                icon={Factory}
                defaultValues={rfqDefaults}
                customerUser={customerUser}
              />
            </div>
          } />

          <Route path="/contact" element={
            <div className="pt-24 bg-slate-50 min-h-screen">
              <SEO title="Contact Us" />
              <ContactUs customerUser={customerUser} />
            </div>
          } />

          <Route path="/news" element={
            <div className="pt-24 bg-slate-50 min-h-screen">
              <SEO title="News & Insights" />
              <News />
            </div>
          } />

          <Route path="/news/:id" element={
            <NewsArticlePage />
          } />

          <Route path="/cart" element={
            <CartPage customerUser={customerUser} />
          } />

          <Route path="/portal" element={
            <div className="pt-24 lg:pt-24 min-h-screen bg-slate-50">
              <SEO title="Client Portal" />
              <CustomerPortal 
                customerUser={customerUser} 
                setCustomerUser={setCustomerUser}
                appVersion={appVersion}
                onCheckUpdate={() => checkOtaUpdate(true)}
                isUpdating={isUpdating}
                otaStatus={otaStatus}
              />
            </div>
          } />

          {isMobile && (
            <Route path="/chat" element={
              <div className="bg-slate-50 min-h-screen">
                <SEO title="Live Chat" />
                <LiveChatWidget
                  customerUser={customerUser}
                  isFullScreen={true}
                  onOpenAuthModal={() => setActiveTab('portal')}
                />
              </div>
            } />
          )}
        </Routes>
        </ErrorBoundary>
      </main>

      {/* Floating Live Chat (Desktop Only) */}
      {!isMobile && (
        <LiveChatWidget
          customerUser={customerUser}
          onOpenAuthModal={() => {
            setActiveTab('portal');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* API Config Modal */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* Industrial Footer (Desktop Only) */}
      {!isMobile && (
        <footer className="bg-brand-navy-dark border-t border-brand-navy-light py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-black">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-black text-white text-base tracking-wider uppercase">Urbanspan Infrastructure</span>
                    <p className="text-xs text-slate-400">Pvt. Ltd. (A Gupta & Sons Enterprise)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Primary Steel Distribution & Industrial Warehousing Network across Central India. Supplying BIS-certified Fe-550D TMT Rebars, Structural Steel, and direct mill consignments.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> BIS Certified Steel
                  </span>
                  <span className="text-slate-600">•</span>
                  <a
                    href="https://www.linkedin.com/company/urbanspan-infrastructure"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#38bdf8] hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                    title="Visit Urbanspan on LinkedIn"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.88a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                    <span>LinkedIn Official</span>
                  </a>
                  <span className="text-slate-600">•</span>
                  <a
                    href="https://maps.google.com/?q=Urbanspan+Infrastructure+Indore"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-steel-light hover:text-white font-medium underline transition-colors"
                  >
                    Google Business Verified
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Office & Warehousing Hub</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  115 Scheme 97, Vanijyak Mandi<br/>
                  Indore, Madhya Pradesh 452009, India
                </p>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Phone:</strong> <a href="tel:+919425922225" className="hover:text-brand-steel-light">094259 22225 / +91 94259 22225</a>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  <strong className="text-slate-300">Email:</strong> <a href="mailto:support@urbanspaninfra.co.in" className="hover:text-brand-steel-light">support@urbanspaninfra.co.in</a>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  <strong className="text-slate-300">Hours:</strong> Mon – Sat: 09:00 AM – 07:00 PM IST
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <Link to="/products" className="hover:text-white transition-colors">Products Catalog</Link>
                  <Link to="/cart" className="hover:text-white transition-colors">Procurement Cart</Link>
                  <Link to="/news" className="hover:text-white transition-colors">Market Insights</Link>
                  <Link to="/about-us" className="hover:text-white transition-colors">About Legacy</Link>
                  <Link to="/rfq" className="hover:text-white transition-colors">Request Quote</Link>
                  <Link to="/portal" className="hover:text-white transition-colors">Customer Portal</Link>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>© {new Date().getFullYear()} Urbanspan Infrastructure Pvt. Ltd. All rights reserved.</p>
              <p className="flex items-center gap-4">
                <span>Indore • Raipur • Ahmedabad • Mumbai</span>
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Bottom Tab Bar (Mobile) */}
      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      </div>
    </CartProvider>
  );
}
