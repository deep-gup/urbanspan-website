import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { fetchSteelProducts } from '../services/headlessApi';
import { Helmet } from 'react-helmet-async';

export default function ProductDetailsPage({ onSelectProductForInquiry }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const products = await fetchSteelProducts();
    const foundProduct = products.find(p => p.sku === id);
    setProduct(foundProduct);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="py-20 max-w-4xl mx-auto px-4 text-center">
        <p className="text-slate-500 animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 max-w-4xl mx-auto px-4 text-center">
        <Helmet>
          <title>Product Not Found | Urbanspan Infrastructure</title>
        </Helmet>
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
        <button onClick={() => navigate('/products')} className="mt-4 text-brand-steel hover:underline">
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{product.name} | Urbanspan Steel Products</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta property="og:title" content={`${product.name} | Urbanspan Steel`} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
      </Helmet>

      <button 
        onClick={() => navigate('/products')} 
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-steel transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      <div className="bg-white shadow-xl border border-slate-200 rounded-3xl p-6 md:p-10">
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="w-full md:w-1/3">
            <img
              src={product.image_url || '/images/tmt_rebars.jpg'}
              alt={product.name}
              className="w-full h-auto rounded-2xl object-cover border border-slate-200 shadow-md"
            />
          </div>
          <div className="w-full md:w-2/3">
            <span className="inline-block px-3 py-1 mb-3 rounded bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 uppercase text-xs font-bold tracking-wider">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-snug mb-2">
              {product.name}
            </h1>
            <p className="text-sm font-mono text-slate-500 mb-6">SKU: {product.sku}</p>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block font-bold uppercase mb-1">Benchmark Price</span>
              {product.base_price ? (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-brand-steel-light">
                    ₹{Number(product.base_price).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-500 font-semibold mb-1">/ Metric Ton</span>
                </div>
              ) : (
                <span className="text-lg font-bold text-slate-500">Price on Request</span>
              )}
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none mb-10 text-slate-600">
          <p>{product.description}</p>
        </div>

        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Technical Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-semibold">{key}</span>
                  <span className="text-slate-900 font-bold text-sm text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => onSelectProductForInquiry(product)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-primary text-slate-900 font-extrabold text-sm shadow-lg shadow-brand-steel/20 hover:scale-105 transition-transform"
          >
            Inquire For Bulk Supply
          </button>
        </div>
      </div>
    </div>
  );
}
