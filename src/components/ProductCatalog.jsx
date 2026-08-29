import React, { useState, useEffect } from 'react';
import { Search, Filter, Layers, CheckCircle2, FileText, ArrowUpRight, Sparkles, RefreshCw, X, ShieldCheck, ShoppingBag, Check } from 'lucide-react';
import { fetchSteelProducts } from '../services/headlessApi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductUnit } from '../utils/productUtils';
import SEO from './SEO';

// Helper to strip raw markdown formatting and extract a clean excerpt for catalog cards
function getCleanDescriptionExcerpt(text, maxLength = 140) {
  if (!text) return 'Premium BIS-certified structural steel engineered for heavy infrastructure and construction demands.';
  const clean = text
    .replace(/^#+\s+/gm, '') // Remove heading starts
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italics
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/^[-*•]\s+/gm, '') // Remove list bullets
    .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/\|/g, ' ') // Remove table pipes
    .replace(/-{3,}/g, ' ') // Remove hr lines
    .replace(/>\s+/g, '') // Remove blockquotes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  if (clean.length > maxLength) {
    return clean.substring(0, maxLength).trim() + '...';
  }
  return clean || 'Premium BIS-certified structural steel engineered for heavy infrastructure and construction demands.';
}

export default function ProductCatalog({ onSelectProductForInquiry }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 25);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId(null);
    }, 2000);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchSteelProducts();
    setProducts(data);
    setLoading(false);
  };

  const uniqueCategories = Array.from(
    new Set(
      products
        .map(p => p.category)
        .filter(c => typeof c === 'string' && c.trim() !== '')
    )
  );
  const categories = ['All', ...uniqueCategories];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || 
      (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Steel Products - Urbanspan Infrastructure",
    "description": "Browse primary and secondary steel products, Fe-550D TMT Rebars, Structural Steel, and benchmark rates from Urbanspan Infrastructure.",
    "url": "https://urbanspaninfra.co.in/products"
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Products | Fe-550D TMT Rebars & Structural Steel Benchmark Rates"
        description="Explore Urbanspan's steel products suite. Certified Fe-550D TMT Rebars, Structural Steel, Billets & Pipes with benchmark rates in Central India."
        structuredData={catalogSchema}
      />
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Direct Mill Inventory Stream
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Products</h2>
          <p className="text-slate-500 text-sm mt-1">benchmark rates</p>
        </div>

        <button
          onClick={loadProducts}
          className="px-4 py-2 rounded-xl bg-white hover:bg-white-light border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Stock
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white shadow-lg border border-slate-200 p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 pr-6 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-steel text-slate-900 shadow-md shadow-brand-steel/20'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white-light/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ISMB, TMT 550D, HR Coils..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-steel"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-steel-light" /> Querying Headless Steel Inventory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id || product.sku} className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-steel/40 transition-all rounded-3xl overflow-hidden flex flex-col group">
              
              {/* Product AI Image */}
              <div 
                className="relative h-48 overflow-hidden bg-slate-50 cursor-pointer"
                onClick={() => {
                  navigate(`/products/${product.sku || product.id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <img
                  src={product.image_url || '/images/tmt_rebars.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.slice(0, 2).map((tag, tIdx) => {
                      const isStock = typeof tag === 'string' && (tag.toLowerCase().includes('stock') || tag.toLowerCase().includes('ready'));
                      return (
                        <span 
                          key={tIdx} 
                          className={`px-2.5 py-1 rounded-lg backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider border shadow-sm ${
                            isStock 
                              ? 'bg-emerald-50/90 text-emerald-700 border-emerald-300' 
                              : 'bg-white/90 text-brand-steel border-slate-200'
                          }`}
                        >
                          {tag}
                        </span>
                      );
                    })
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-brand-steel font-extrabold text-[11px] uppercase tracking-wider">
                      {product.category || 'Steel'}
                    </span>
                  )}
                </div>
                {product.category && (
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 
                    onClick={() => {
                      navigate(`/products/${product.sku || product.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-lg font-bold text-slate-900 leading-snug mb-2 hover:text-brand-steel transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
                    {getCleanDescriptionExcerpt(product.description)}
                  </p>
                  {product.gauge_differentials && Object.keys(product.gauge_differentials).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-brand-steel/10 text-brand-steel border border-brand-steel/20 text-[10px] font-extrabold flex items-center gap-1">
                        <span>📐</span> {Object.keys(product.gauge_differentials).length} Sizes ({Object.keys(product.gauge_differentials).join(', ')})
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Benchmark Price</span>
                      {product.base_price ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-brand-steel-light">
                              ₹{Number(product.base_price).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">/ {getProductUnit(product)}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                            + 18% GST (Ex-mill)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">
                          Price on Request
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate(`/products/${product.sku || product.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      Specs <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                        addedId === product.id
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm scale-95'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {addedId === product.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-brand-steel" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectProductForInquiry(product)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-brand-steel hover:text-slate-900 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>Quote RFQ</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      </div>
  );
}
