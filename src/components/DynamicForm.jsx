import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, Package, Calculator } from 'lucide-react';
import { getFormSchemaByName, submitDynamicFormByName, fetchSteelProducts } from '../services/headlessApi';

export default function DynamicForm({ formName, title, subtitle, icon: Icon, defaultValues = {}, customerUser }) {
  const [schema, setSchema] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load products list and form schema
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [schemaData, productsData] = await Promise.all([
          getFormSchemaByName(formName),
          fetchSteelProducts().catch(() => [])
        ]);

        setSchema(schemaData);
        setProducts(productsData || []);

        const initialData = { ...defaultValues };

        // If a preselected product is passed or defaultValues has product_id
        if (defaultValues.preselectedProduct) {
          initialData.product_id = defaultValues.preselectedProduct.id;
          initialData.product_name = defaultValues.preselectedProduct.name;
          initialData.sku = defaultValues.preselectedProduct.sku;
          initialData.benchmark_rate = defaultValues.preselectedProduct.base_price;
        } else if (defaultValues.product_id && productsData.length > 0) {
          const match = productsData.find(p => p.id === defaultValues.product_id || p.sku === defaultValues.product_id);
          if (match) {
            initialData.product_id = match.id;
            initialData.product_name = match.name;
            initialData.sku = match.sku;
            initialData.benchmark_rate = match.base_price;
          }
        }

        // Set default quantity if not provided
        if (!initialData.quantity) {
          initialData.quantity = 50;
        }

        schemaData?.fields?.forEach(f => {
          if (initialData[f.name] === undefined) {
            initialData[f.name] = '';
          }
        });

        // Compute initial expected value
        const rate = Number(initialData.benchmark_rate) || 0;
        const qty = Number(initialData.quantity) || 0;
        if (rate > 0 && qty > 0) {
          initialData.expected_value = rate * qty;
        }

        setFormData(initialData);
      } catch (err) {
        setErrorMessage('Failed to load form configuration.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (formName) {
      loadData();
    } else {
      setLoading(false);
      setErrorMessage('No Form Name provided.');
    }
  }, [formName, defaultValues]);

  // Current selected product helper
  const selectedProduct = products.find(p => p.id === formData.product_id || p.sku === formData.sku) || defaultValues.preselectedProduct || null;
  const currentBasePrice = Number(selectedProduct?.base_price || formData.benchmark_rate) || 0;
  const currentQuantity = Number(formData.quantity) || 0;
  const computedTotal = currentBasePrice * currentQuantity;

  const handleProductChange = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const price = Number(prod.base_price) || 0;
      const qty = Number(formData.quantity) || 50;
      setFormData(prev => ({
        ...prev,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        benchmark_rate: price,
        expected_value: price > 0 ? price * qty : prev.expected_value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        product_id: '',
        product_name: 'General Steel Inquiries',
        sku: '',
        benchmark_rate: 0
      }));
    }
  };

  const handleQuantityChange = (qtyVal) => {
    const qty = Number(qtyVal);
    setFormData(prev => {
      const price = Number(prev.benchmark_rate || currentBasePrice) || 0;
      return {
        ...prev,
        quantity: qtyVal,
        expected_value: price > 0 && qty > 0 ? price * qty : prev.expected_value
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payloadToSubmit = {
        ...formData,
        product_id: formData.product_id || selectedProduct?.id || null,
        product_name: formData.product_name || selectedProduct?.name || null,
        sku: formData.sku || selectedProduct?.sku || null,
        quantity: Number(formData.quantity) || 1,
        expected_value: computedTotal > 0 ? computedTotal : (Number(formData.expected_value) || null)
      };

      await submitDynamicFormByName(formName, payloadToSubmit);
      setSubmitted(true);

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', {
          event_category: 'form',
          event_label: formName,
          value: computedTotal || 1
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.error || 'Failed to submit form. Please check connection/API configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="py-16 max-w-4xl mx-auto px-4 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (errorMessage && !schema) {
    return (
      <div className="py-16 max-w-4xl mx-auto px-4 text-center">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        {Icon && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-steel/10 text-brand-steel border border-brand-steel/20 text-xs font-semibold mb-3">
            <Icon className="w-3.5 h-3.5" /> Urbanspan Commercial Desk
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-slate-900">{title || schema?.name || 'Commercial Steel RFQ'}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">{subtitle}</p>}
      </div>

      {submitted ? (
        <div className="bg-white shadow-xl border border-emerald-500/30 bg-emerald-50/20 p-10 rounded-3xl text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-slate-900">Commercial RFQ Transmitted!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Thank you for contacting Urbanspan Infrastructure. Your bulk tonnage inquiry has been routed to our Distro App CRM sales desk. A key account manager will issue your official proforma rate quote shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ ...defaultValues, quantity: 50 });
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
          >
            Submit Another RFQ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-xl border border-slate-200 p-6 sm:p-10 rounded-3xl space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {customerUser && (
            <div className="bg-brand-steel/5 border border-brand-steel/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-steel/10 flex items-center justify-center text-brand-steel font-bold text-base border border-brand-steel/20">
                {customerUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Submitting On Behalf Of</p>
                <p className="text-base font-bold text-slate-900">{customerUser.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{customerUser.email} {customerUser.company ? `• ${customerUser.company}` : ''}</p>
              </div>
            </div>
          )}

          {/* Product & Steel Grade Selection */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Package className="w-4 h-4 text-brand-steel" /> Steel Product / Specification *
              </label>
              {currentBasePrice > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Benchmark: ₹{currentBasePrice.toLocaleString('en-IN')}/{selectedProduct?.unit || 'ton'}
                </span>
              )}
            </div>

            <select
              value={formData.product_id || selectedProduct?.id || ''}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:border-brand-steel transition-colors"
            >
              <option value="">General Steel RFQ / Custom Specification</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.base_price ? `— ₹${Number(p.base_price).toLocaleString('en-IN')}/${p.unit || 'ton'}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity / Tonnage Input with Quick Chips */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-brand-steel" /> Required Quantity (Metric Tons) *
              </label>
              <span className="text-xs text-slate-500 font-medium">Bulk dispatch in MT</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 50"
                value={formData.quantity || ''}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full sm:w-48 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-black text-base focus:outline-none focus:border-brand-steel transition-colors"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[25, 30, 50, 100, 250, 500].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleQuantityChange(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      Number(formData.quantity) === t
                        ? 'bg-brand-steel text-white border-brand-steel shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t} MT
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Banner with 18% GST Breakdown */}
            {computedTotal > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Estimated Base Subtotal ({currentQuantity} MT @ ₹{currentBasePrice.toLocaleString('en-IN')}/ton):</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    ₹{computedTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold pt-1 border-t border-emerald-500/20">
                  <span>+ Applicable GST @ 18% (HSN 7214):</span>
                  <span className="font-mono">₹{Math.round(computedTotal * 0.18).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/30">
                  <span className="font-black text-slate-900 uppercase tracking-wider">Total Valuation (incl. 18% GST):</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ₹{Math.round(computedTotal * 1.18).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {!customerUser && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Commercial Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Sharma"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Company / Infrastructure Org *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Infra Projects Ltd"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. amit.buyer@metroinfra.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 94259 22225"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Project Site Location & Delivery Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Specify delivery destination (e.g. Indore Ring Road Project Site), required billing terms, or preferred mill brand..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-primary hover:opacity-95 text-slate-900 font-black text-sm sm:text-base shadow-xl shadow-brand-steel/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {submitting ? 'Transmitting to CRM Sales Desk...' : 'Submit Commercial Steel RFQ'} <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
