import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Share2, Check, Copy, Sparkles, 
  ChevronRight, Layers, Tag, Box, Info 
} from 'lucide-react';
import { fetchSteelProducts } from '../services/headlessApi';
import SEO from './SEO';

export default function ProductDetailsPage({ onSelectProductForInquiry }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

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
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | Urbanspan Steel`,
      text: product.description ? product.description.substring(0, 120) + '...' : `Check out ${product.name} on Urbanspan`,
      url: window.location.href
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
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper to parse and render formatted markdown text
  const renderFormattedDescription = (text) => {
    if (!text) return <p className="text-slate-400 italic">No description available for this product.</p>;

    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={index} className="h-3" />);
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-lg font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-steel rounded-full inline-block" />
            {formatInline(trimmed.slice(4))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-xl font-extrabold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-2">
            {formatInline(trimmed.slice(3))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-black text-slate-900 mt-6 mb-3">
            {formatInline(trimmed.slice(2))}
          </h2>
        );
        return;
      }

      // Blockquotes / Highlight Callouts
      if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={index} className="my-3 p-3.5 bg-slate-50 border-l-4 border-brand-steel rounded-r-xl text-sm text-slate-700 font-medium">
            {formatInline(trimmed.slice(2))}
          </div>
        );
        return;
      }

      // Bullet Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-*•]\s+/, '');
        elements.push(
          <li key={index} className="flex items-start gap-2.5 text-slate-700 text-sm md:text-base my-1.5 ml-2">
            <span className="text-brand-steel font-bold mt-1 text-sm">▸</span>
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
          <div key={index} className="flex items-start gap-2.5 text-slate-700 text-sm md:text-base my-1.5 ml-2">
            <span className="font-bold text-brand-steel min-w-[20px]">{num}.</span>
            <span className="leading-relaxed">{formatInline(itemText)}</span>
          </div>
        );
        return;
      }

      // Regular Paragraphs
      elements.push(
        <p key={index} className="text-slate-600 text-sm md:text-base leading-relaxed my-2">
          {formatInline(trimmed)}
        </p>
      );
    });

    return <div className="space-y-1">{elements}</div>;
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
      "url": typeof window !== 'undefined' ? window.location.href : `https://urbanspaninfra.co.in/products/${product.sku}`,
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
              
              <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mb-6">
                <span>SKU: <strong className="text-slate-700">{product.sku || 'N/A'}</strong></span>
                {product.hsn_code && <span>HSN: <strong className="text-slate-700">{product.hsn_code}</strong></span>}
              </div>
              
              {/* Benchmark Pricing Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider mb-1">Live Benchmark Rate</span>
                {product.base_price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-brand-steel-light">
                      ₹{Number(product.base_price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-slate-500 font-semibold">
                      / {product.unit || 'Metric Ton'} (ex-plant)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-700">Market Rate on Request</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">Rates are subject to order quantity, destination logistics, and mill revisions.</p>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => onSelectProductForInquiry && onSelectProductForInquiry(product)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-primary text-slate-900 font-black text-base shadow-lg shadow-brand-steel/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Inquire For Bulk Supply / Dispatch</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatted Rich Description Section */}
        <div className="border-t border-slate-200/80 pt-8 mb-10">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-brand-steel" /> Product Overview & Highlights
          </h3>
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            {renderFormattedDescription(product.description)}
          </div>
        </div>

        {/* Technical Specifications Grid */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="border-t border-slate-200/80 pt-8 mb-6">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Technical & Material Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{key}</span>
                  <span className="text-slate-900 font-black text-sm">{String(val)}</span>
                </div>
              ))}
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
