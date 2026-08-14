import React, { useState, useEffect } from 'react';
import { Search, Filter, Layers, CheckCircle2, FileText, ArrowUpRight, Sparkles, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { fetchSteelProducts } from '../services/headlessApi';
import { useNavigate } from 'react-router-dom';

export default function ProductCatalog({ onSelectProductForInquiry }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchSteelProducts();
    setProducts(data);
    setLoading(false);
  };

  const categories = ['All', 'Rebars', 'Structural Steel', 'Coils & Sheets', 'Piping & Tubes', 'Plates'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Direct Mill Inventory Stream
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Commercial Steel Catalog</h2>
          <p className="text-slate-500 text-sm mt-1">Live benchmark pricing and certified specifications for primary steel products.</p>
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
                  navigate(`/products/${product.sku}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <img
                  src={product.image_url || '/images/tmt_rebars.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50/80 backdrop-blur-md border border-slate-200 text-brand-steel-light font-extrabold text-[11px]">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    Stock Available
                  </span>
                </div>
              </div>

              {/* Product Info Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold block mb-1">SKU: {product.sku}</span>
                  <h3 
                    onClick={() => {
                      navigate(`/products/${product.sku}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-lg font-bold text-slate-900 leading-snug mb-2 hover:text-brand-steel-light transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>
                </div>

                <div>
                  <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between mb-4">
                    <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Benchmark Price</span>
                        {product.base_price ? (
                          <>
                            <span className="text-xl font-black text-brand-steel-light">
                              ₹{Number(product.base_price).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1">/ Metric Ton</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            Price on Request
                          </span>
                        )}
                      </div>
                    
                    <button
                      onClick={() => {
                        navigate(`/products/${product.sku}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      Specs <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectProductForInquiry(product)}
                    className="w-full py-3 rounded-xl bg-white hover:bg-brand-steel hover:text-slate-900 text-slate-900 font-extrabold text-xs border border-slate-200 hover:border-brand-steel transition-all flex items-center justify-center gap-2"
                  >
                    Request Commercial Quote
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      </div>
  );
}
