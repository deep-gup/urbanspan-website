import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Share2, Check, CheckCircle2,
  ChevronRight, ChevronDown, ChevronUp, Layers, Info,
  ShoppingBag, Plus, Minus
} from 'lucide-react';
import { fetchSteelProducts } from '../services/headlessApi';
import { useCart } from '../context/CartContext';
import { getProductUnit, getQuantityPresets } from '../utils/productUtils';
import SEO from './SEO';

export default function ProductDetailsPage({ onSelectProductForInquiry }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [customTonnage, setCustomTonnage] = useState(50);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProductData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const products = await fetchSteelProducts();
      setAllProducts(products || []);
      const foundProduct = products.find(p => p.sku === id || p.id === id);
      setProduct(foundProduct || null);
      setSelectedImageIndex(0);
      if (foundProduct && typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'view_item', {
          items: [{
            item_id: foundProduct.sku,
            item_name: foundProduct.name,
            item_category: foundProduct.category?.name || 'Steel'
          }]
        });
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPublicShareUrl = () => {
    const sku = product?.sku || skuParam || '';
    return `https://urbanspaninfra.co.in/products/${encodeURIComponent(sku)}`;
  };

  const handleShare = async () => {
    const shareUrl = getPublicShareUrl();
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'share', {
        method: 'button',
        content_type: 'product',
        item_id: product?.sku
      });
    }
    const shareData = {
      title: `${product.name} | Urbanspan Steel`,
      text: product.description ? product.description.substring(0, 120) + '...' : `Check out ${product.name} on Urbanspan`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const shareUrl = getPublicShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper to parse and render formatted markdown text with compact typography
  const renderFormattedDescription = (text) => {
    if (!text) return <p className="text-slate-400 text-xs italic">No description available for this product.</p>;

    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={index} className="h-2" />);
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-xs sm:text-sm font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-brand-steel rounded-full inline-block" />
            {formatInline(trimmed.slice(4))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-sm sm:text-base font-extrabold text-slate-900 mt-4 mb-2 border-b border-slate-200/60 pb-1">
            {formatInline(trimmed.slice(3))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={index} className="text-base sm:text-lg font-black text-slate-900 mt-4 mb-2">
            {formatInline(trimmed.slice(2))}
          </h2>
        );
        return;
      }

      // Blockquotes / Highlight Callouts
      if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={index} className="my-2 p-2.5 bg-slate-100/70 border-l-2 border-brand-steel rounded-r-lg text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            {formatInline(trimmed.slice(2))}
          </div>
        );
        return;
      }

      // Bullet Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-*•]\s+/, '');
        elements.push(
          <li key={index} className="flex items-start gap-2 text-slate-600 text-xs sm:text-sm my-1 ml-1.5">
            <span className="text-brand-steel font-bold mt-0.5 text-xs">▸</span>
            <span className="leading-relaxed">{formatInline(itemText)}</span>
          </li>
        );
        return;
      }

      // Numbered Lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\.\s+/)[1];
        const itemText = trimmed.replace(/^\d+\.\s+/, '');
        elements.push(
          <div key={index} className="flex items-start gap-2 text-slate-600 text-xs sm:text-sm my-1 ml-1.5">
            <span className="font-bold text-brand-steel min-w-[16px] text-xs">{num}.</span>
            <span className="leading-relaxed">{formatInline(itemText)}</span>
          </div>
        );
        return;
      }

      // Regular Paragraphs
      elements.push(
        <p key={index} className="text-slate-600 text-xs sm:text-sm leading-relaxed my-1.5">
          {formatInline(trimmed)}
        </p>
      );
    });

    return <div className="space-y-0.5">{elements}</div>;
  };

  const formatInline = (text) => {
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
      const italicMatch = remaining.match(/\*(.*?)\*/);

      let earliestMatch = null;
      let matchType = null;

      if (boldMatch && (!earliestMatch || boldMatch.index < earliestMatch.index)) {
        earliestMatch = boldMatch;
        matchType = 'bold';
      }
      if (linkMatch && (!earliestMatch || linkMatch.index < earliestMatch.index)) {
        earliestMatch = linkMatch;
        matchType = 'link';
      }
      if (italicMatch && (!earliestMatch || italicMatch.index < earliestMatch.index)) {
        earliestMatch = italicMatch;
        matchType = 'italic';
      }

      if (!earliestMatch) {
        parts.push(remaining);
        break;
      }

      if (earliestMatch.index > 0) {
        parts.push(remaining.substring(0, earliestMatch.index));
      }

      if (matchType === 'bold') {
        parts.push(<strong key={keyIdx++} className="font-bold text-slate-900">{earliestMatch[1]}</strong>);
      } else if (matchType === 'italic') {
        parts.push(<em key={keyIdx++} className="italic text-slate-800">{earliestMatch[1]}</em>);
      } else if (matchType === 'link') {
        parts.push(
          <a key={keyIdx++} href={earliestMatch[2]} target="_blank" rel="noreferrer" className="text-brand-steel hover:underline font-semibold">
            {earliestMatch[1]}
          </a>
        );
      }

      remaining = remaining.substring(earliestMatch.index + earliestMatch[0].length);
    }

    return parts;
  };

  if (loading) {
    return (
      <div className="py-28 max-w-4xl mx-auto px-4 text-center">
        <div className="w-12 h-12 border-4 border-brand-steel border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-28 max-w-4xl mx-auto px-4 text-center">
        <SEO title="Product Not Found" />
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The requested steel SKU may have been updated or moved.</p>
        <button 
          onClick={() => navigate('/products')} 
          className="px-6 py-3 rounded-xl bg-brand-steel text-white font-bold hover:bg-brand-steel-light transition-colors"
        >
          Return to Product Catalog
        </button>
      </div>
    );
  }

  // Construct images list
  const galleryImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image_url ? [product.image_url] : ['/images/tmt_rebars.jpg']);

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0] || '/images/tmt_rebars.jpg';

  // Related products (exclude current)
  const relatedProducts = allProducts
    .filter(p => (p.sku !== product.sku && p.id !== product.id))
    .slice(0, 3);

  // Schema.org Structured Data for Google Rich Snippets
  const productStructuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": galleryImages,
    "description": product.description || `${product.name} supplied by Urbanspan Infrastructure.`,
    "sku": product.sku,
    "category": product.category,
    "brand": {
      "@type": "Brand",
      "name": "Urbanspan Steel"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://urbanspaninfra.co.in/products/${product.sku}`,
      "priceCurrency": product.currency || "INR",
      "price": product.base_price || 0,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <div className="py-12 md:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO 
        title={`${product.name} - Specifications & Bulk Supply`}
        description={product.description ? product.description.substring(0, 160) : `Buy ${product.name} in bulk. Certified primary steel distribution.`}
        image={currentImage}
        type="product"
        structuredData={productStructuredData}
      />

      {/* Top Navigation & Share Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button 
          onClick={() => navigate('/products')} 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-steel transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:text-brand-steel hover:border-brand-steel/30 transition-all hover:shadow"
          title="Share on WhatsApp, LinkedIn, or Copy Link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-brand-steel" />
              <span>Share Product</span>
            </>
          )}
        </button>
      </div>

      {/* Main Product Card */}
      <div className="bg-white shadow-xl border border-slate-200/80 rounded-3xl p-6 md:p-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
          
          {/* Left: Interactive Multi-Image Gallery */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Main Stage Image */}
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
              <img
                src={currentImage}
                alt={`${product.name} photo ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-50 ${
                      selectedImageIndex === idx 
                        ? 'border-brand-steel ring-2 ring-brand-steel/30 scale-95 shadow-md' 
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Metadata & Price Benchmark */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.category && (
                  <span className="px-3 py-1 rounded-lg bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 uppercase text-xs font-extrabold tracking-wider">
                    {product.category}
                  </span>
                )}
                {product.tags && product.tags.length > 0 ? (
                  product.tags.map((tag, tIdx) => {
                    const tagLower = typeof tag === 'string' ? tag.toLowerCase() : '';
                    if (tagLower === (product.category || '').toLowerCase()) return null; // Avoid duplicate category
                    const isStock = tagLower.includes('stock') || tagLower.includes('ready') || tagLower.includes('dispatch');
                    const isPrimary = tagLower.includes('primary') || tagLower.includes('structural') || tagLower.includes('grade');
                    const isQuality = tagLower.includes('bis') || tagLower.includes('certified') || tagLower.includes('fe ') || tagLower.includes('export');

                    let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (isStock) badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (isPrimary) badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (isQuality) badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';

                    return (
                      <span key={tIdx} className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${badgeStyle}`}>
                        {isStock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {isQuality && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {tag}
                      </span>
                    );
                  })
                ) : (
                  product.is_active !== false && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock & Ready
                    </span>
                  )
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-2">
                {product.name}
              </h1>
              
              {product.hsn_code && (
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mb-4">
                  <span>HSN Code: <strong className="text-slate-700">{product.hsn_code}</strong></span>
                </div>
              )}
              
              {/* Benchmark Pricing Box with 18% Tax Details */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-5 space-y-3">
                <div>
                  <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wider mb-1">Live Mill Benchmark Rate</span>
                  {product.base_price ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-brand-steel-light">
                          ₹{Number(product.base_price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-slate-500 font-bold">
                          / {getProductUnit(product)} (ex-plant)
                        </span>
                      </div>
                      
                      {/* GST Tax Breakdown Pill */}
                      <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Applicable GST @ 18%:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600">+₹{Math.round(product.base_price * 0.18).toLocaleString('en-IN')}/{getProductUnit(product)}</span>
                          <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Effective: ₹{Math.round(product.base_price * 1.18).toLocaleString('en-IN')}/{getProductUnit(product)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-700">Market Rate on Request</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">Base mill ex-plant rates. Statutory 18% GST (HSN 7214) applied on invoice. Logistics calculated upon site dispatch.</p>
                </div>
              </div>

              {/* Requirement & Quantity Selector & Buyer Action Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Requirement ({getProductUnit(product)}):
                  </span>
                  <div className="flex items-center gap-1">
                    {getQuantityPresets(product).map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setCustomTonnage(qty)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                          customTonnage === qty 
                            ? 'bg-brand-steel text-white border-brand-steel shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {qty} {getProductUnit(product)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setCustomTonnage(prev => Math.max(1, prev - 5))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={customTonnage}
                      onChange={(e) => setCustomTonnage(Math.max(1, Number(e.target.value)))}
                      className="w-16 text-center bg-transparent text-slate-900 font-black text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold pr-2">{getProductUnit(product)}</span>
                    <button
                      type="button"
                      onClick={() => setCustomTonnage(prev => prev + 5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, customTonnage);
                      setAddedToCart(true);
                      setTimeout(() => setAddedToCart(false), 2500);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 shadow-sm ${
                      addedToCart 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20' 
                        : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added {customTonnage} {getProductUnit(product)} to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-brand-steel" />
                        <span>Add {customTonnage} {getProductUnit(product)} to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Direct RFQ Action Button */}
            <button
              onClick={() => onSelectProductForInquiry && onSelectProductForInquiry({ ...product, selectedQuantity: customTonnage })}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-primary text-slate-900 font-black text-base shadow-lg shadow-brand-steel/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Inquire For Bulk Supply / Dispatch ({customTonnage} {getProductUnit(product)})</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatted Rich Description Section - Expandable Container */}
        <div className="border-t border-slate-200/80 pt-6 mb-8">
          <div 
            onClick={() => setIsOverviewExpanded(prev => !prev)}
            className="flex items-center justify-between cursor-pointer group py-2"
          >
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-steel" /> Product Overview & Highlights
            </h3>
            <button
              type="button"
              className="text-xs font-bold text-brand-steel hover:text-brand-steel-dark flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-steel/10 group-hover:bg-brand-steel/20 transition-all"
            >
              <span>{isOverviewExpanded ? 'Show Less' : 'Expand Overview'}</span>
              {isOverviewExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-3 relative rounded-2xl bg-slate-50/70 border border-slate-200/70 overflow-hidden transition-all duration-300">
            <div className={`p-5 sm:p-6 transition-all duration-300 ${!isOverviewExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
              {renderFormattedDescription(product.description)}
            </div>

            {/* Gradient Overlay and Expand Trigger when collapsed */}
            {!isOverviewExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent flex items-end justify-center pb-3">
                <button
                  type="button"
                  onClick={() => setIsOverviewExpanded(true)}
                  className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-brand-steel font-extrabold text-xs shadow-sm hover:shadow-md hover:bg-brand-steel hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span>Read Full Overview & Specifications</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Technical Specifications & TMT Gauge Differentials Matrix (2-Column Layout at Bottom) */}
        {((product.specs && Object.keys(product.specs).length > 0) || (product.gauge_differentials && Object.keys(product.gauge_differentials).length > 0)) && (
          <div className="border-t border-slate-200/80 pt-8 mb-8">
            <div className={`grid grid-cols-1 ${
              (product.specs && Object.keys(product.specs).length > 0) && (product.gauge_differentials && Object.keys(product.gauge_differentials).length > 0)
                ? 'lg:grid-cols-2'
                : 'grid-cols-1'
            } gap-6 items-start`}>
              
              {/* Column 1: Technical & Material Specifications */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 m-0">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" /> Technical & Material Specifications
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 m-0">
                          Metallurgical, chemical & structural standard compliance
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Verified Specs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex flex-col justify-between shadow-xs">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{key}</span>
                          <span className="text-slate-900 font-black text-xs sm:text-sm">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2 mt-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Adheres to Bureau of Indian Standards (BIS IS 1786) & ISO metallurgical quality parameters.</span>
                  </div>
                </div>
              )}

              {/* Column 2: TMT Gauge / Size Differentials Matrix */}
              {product.gauge_differentials && Object.keys(product.gauge_differentials).length > 0 && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-3 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5 m-0">
                          <span>📐</span> TMT Gauge / Size Differentials Matrix
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 m-0">
                          Official mill size differentials applied over the base benchmark rate
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold text-brand-steel bg-brand-steel/10 px-2.5 py-1 rounded-full border border-brand-steel/20 self-start sm:self-auto">
                        {Object.keys(product.gauge_differentials).length} Sizes Manufactured
                      </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-2.5 rounded-l-lg">Gauge</th>
                            <th className="py-2.5 px-2.5">Packaging</th>
                            <th className="py-2.5 px-2.5 text-center">Differential</th>
                            <th className="py-2.5 px-2.5 text-right">Ex-Mill Rate</th>
                            <th className="py-2.5 px-2.5 text-right rounded-r-lg">Incl. 18% GST</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60">
                          {Object.entries(product.gauge_differentials).map(([sizeKey, diffVal]) => {
                            const diff = typeof diffVal === 'object' ? (diffVal.value ?? diffVal.diff ?? 0) : Number(diffVal) || 0;
                            const isBase = diff === 0;
                            const baseRate = Number(product.base_price || 0);
                            const sizeExMill = baseRate > 0 ? baseRate + diff : null;
                            const sizeWithGst = sizeExMill ? Math.round(sizeExMill * 1.18) : null;

                            const packagingMap = {
                              '8mm': '10 pcs/bdl',
                              '10mm': '7 pcs/bdl',
                              '12mm': '4 pcs/bdl',
                              '16mm': '3 pcs/bdl',
                              '20mm': '2 pcs/bdl',
                              '25mm': '1 pc/bdl',
                              '28mm': '1 pc/bdl',
                              '32mm': '1 pc/bdl'
                            };
                            const packaging = packagingMap[sizeKey.toLowerCase()] || 'Standard Bdl';

                            return (
                              <tr key={sizeKey} className="hover:bg-slate-100/60 transition-colors">
                                <td className="py-2 px-2.5 font-extrabold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-brand-steel">
                                      {sizeKey.replace(/[^0-9]/g, '')}
                                    </span>
                                    <span>{sizeKey.toUpperCase()}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-slate-500 font-medium text-[11px]">
                                  {packaging}
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  {isBase ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Base Rate (₹0)
                                    </span>
                                  ) : diff > 0 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      +₹{diff.toLocaleString('en-IN')}/{getProductUnit(product)}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      -₹{Math.abs(diff).toLocaleString('en-IN')}/{getProductUnit(product)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono text-[11px]">
                                  {sizeExMill ? `₹${sizeExMill.toLocaleString('en-IN')}` : 'On Request'}
                                </td>
                                <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700 font-mono text-[11px]">
                                  {sizeWithGst ? `₹${sizeWithGst.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed flex items-start gap-1.5 mt-3">
                    <Info className="w-3.5 h-3.5 text-brand-steel flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Billing Note:</strong> Core diameters (12mm–25mm) transact at the base rate. Non-core sections (8mm, 10mm, 32mm) include mill section differentials. Quotations and tax invoices show individual gauge line items.
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Related Products Section for SEO Discoverability & Cross-linking */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-brand-steel" /> Related Steel Products
            </h2>
            <Link to="/products" className="text-sm font-bold text-brand-steel hover:underline flex items-center gap-1">
              View Entire Catalog <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map(rel => {
              const relImg = (Array.isArray(rel.images) && rel.images[0]) || rel.image_url || '/images/tmt_rebars.jpg';
              return (
                <div 
                  key={rel.sku || rel.id}
                  onClick={() => navigate(`/products/${rel.sku || rel.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-brand-steel/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <img src={relImg} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-[11px] font-bold text-brand-steel uppercase tracking-wider block mb-1">
                      {rel.category || 'Steel'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-steel transition-colors line-clamp-2 mb-2">
                      {rel.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-slate-800">
                      {rel.base_price ? `₹${Number(rel.base_price).toLocaleString('en-IN')}` : 'Contact for Price'}
                    </span>
                    <span className="text-xs font-extrabold text-brand-steel group-hover:translate-x-0.5 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
