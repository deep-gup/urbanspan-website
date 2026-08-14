import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailsPage from './components/ProductDetailsPage';
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
import { Building2, ShieldCheck, Factory, Send } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive activeTab from current route so Navbar/BottomTabBar still highlight correctly
  const path = location.pathname.toLowerCase();
  let activeTab = 'home';
  if (path.includes('about')) activeTab = 'about';
  else if (path.includes('products')) activeTab = 'products';
  else if (path.includes('contact')) activeTab = 'contact';
  else if (path.includes('rfq')) activeTab = 'rfq';
  else if (path.includes('news')) activeTab = 'news';
  else if (path.includes('portal')) activeTab = 'portal';
  else if (path.includes('chat')) activeTab = 'chat';

  const setActiveTab = (tab) => {
    let newPath = '/';
    if (tab === 'about') newPath = '/about-us';
    else if (tab === 'news') newPath = '/news';
    else if (tab !== 'home') newPath = `/${tab}`;
    navigate(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady().catch(console.error);
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
    setActiveTab('rfq');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rfqDefaults = {};
  if (selectedProductForInquiry) {
    rfqDefaults.notes = `Commercial RFQ for Product: ${selectedProductForInquiry.name} (SKU: ${selectedProductForInquiry.sku}). Estimated Tonnage Required: 100 MT.`;
  }
  if (customerUser) {
    rfqDefaults.name = customerUser.name;
    rfqDefaults.email = customerUser.email;
    rfqDefaults.company = customerUser.company;
  }

  return (
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
          <a
            href="/urbanspan-app-v3.apk"
            download
            className="px-3 py-1.5 bg-brand-navy hover:bg-brand-navy-dark text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 shadow-md"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            GET APP
          </a>
        </div>
      )}

      {/* Main Pages */}
      <main className="flex-1 pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={
            isMobile ? (
              <>
                <SEO title="Home" />
                <MobileDashboard 
                  customerUser={customerUser} 
                  onNavigate={setActiveTab} 
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

          <Route path="/products/:id" element={
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

          <Route path="/portal" element={
            <div className="pt-24 lg:pt-24 min-h-screen bg-slate-50">
              <SEO title="Client Portal" />
              <CustomerPortal customerUser={customerUser} setCustomerUser={setCustomerUser} />
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-black">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-white text-base tracking-wider uppercase">Urbanspan Infrastructure Private Limited</span>
                <p className="text-xs text-slate-400">Primary Steel Distribution & Industrial Warehousing Network</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-brand-steel-light font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BIS Certified Steel
              </span>
            </div>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Urbanspan Infrastructure Pvt Ltd. All rights reserved.
            </p>
          </div>
        </footer>
      )}

      {/* Bottom Tab Bar (Mobile) */}
      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}
