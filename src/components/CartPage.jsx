import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  Building2, Truck, CheckCircle2, AlertCircle, Send, 
  ArrowLeft, RefreshCw 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { submitDynamicFormByName } from '../services/headlessApi';
import SEO from './SEO';

export default function CartPage({ customerUser }) {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    totalCount, 
    totalQuantity, 
    subtotal, 
    totalGst, 
    grandTotal 
  } = useCart();

  const [buyerInfo, setBuyerInfo] = useState({
    name: customerUser?.name || '',
    company: customerUser?.company || '',
    email: customerUser?.email || '',
    phone: customerUser?.phone || '',
    delivery_location: '',
    site_notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [leadResult, setLeadResult] = useState(null);
  const [submittedSummary, setSubmittedSummary] = useState(null);

  const handleInputChange = (field, val) => {
    setBuyerInfo(prev => ({ ...prev, [field]: val }));
  };

  const handleTonnagePreset = (itemId, tonnage) => {
    updateQuantity(itemId, tonnage);
  };

  const handleSubmitMultiRFQ = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.email) {
      setErrorMessage('Please provide your name, phone number, and email address.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Compose item notes summary
      const itemsSummary = cartItems
        .map(i => `${i.name}: ${i.quantity} ${i.unit || 'MT'} @ ₹${Number(i.base_price).toLocaleString('en-IN')}/${i.unit || 'MT'}`)
        .join(' + ');

      const composedNotes = `Multi-Product Procurement Cart RFQ (${totalQuantity} MT Total Consignment):\n` +
        cartItems.map((i, idx) => `  ${idx + 1}. ${i.name} - ${i.quantity} MT @ ₹${Number(i.base_price).toLocaleString('en-IN')}/MT (Base: ₹${i.lineSubtotal.toLocaleString('en-IN')}, GST: ₹${i.lineGst.toLocaleString('en-IN')})`).join('\n') +
        `\nDestination Location: ${buyerInfo.delivery_location || 'Not specified'}\nSite Notes: ${buyerInfo.site_notes || 'Standard Delivery'}`;

      const payload = {
        name: buyerInfo.name,
        company: buyerInfo.company,
        email: buyerInfo.email,
        phone: buyerInfo.phone,
        source: 'buyer_cart_rfq',
        quantity: totalQuantity,
        expected_value: subtotal, // Base expected value for CRM quotation engine
        notes: composedNotes,
        custom_data: {
          delivery_location: buyerInfo.delivery_location,
          site_notes: buyerInfo.site_notes,
          total_tonnage: totalQuantity,
          base_subtotal: subtotal,
          gst_18_amount: totalGst,
          grand_total_with_tax: grandTotal,
          items_count: totalCount,
          items: cartItems.map(item => ({
            product_id: item.id,
            sku: item.sku,
            product_name: item.name,
            category: item.category,
            quantity: item.quantity,
            base_price: item.base_price,
            unit: item.unit || 'MT',
            line_subtotal: item.lineSubtotal,
            gst_18: item.lineGst,
            line_total: item.lineTotal
          }))
        },
        items: cartItems.map(item => ({
          product_id: item.id,
          sku: item.sku,
          product_name: item.name,
          category: item.category,
          quantity: item.quantity,
          base_price: item.base_price,
          unit: item.unit || 'MT',
          line_subtotal: item.lineSubtotal,
          gst_18: item.lineGst,
          line_total: item.lineTotal
        }))
      };

      const res = await submitDynamicFormByName('lead_capture', payload);
      setLeadResult(res?.data || res);
      const generatedRefId = res?.data?.reference_id || `RFQ-CONSIGNMENT-${Date.now().toString().slice(-6)}`;
      setSubmittedSummary({
        quantity: totalQuantity,
        company: buyerInfo.company || buyerInfo.name,
        referenceId: generatedRefId
      });
      setSubmitted(true);
      clearCart();

      // Trigger Google Analytics 4 event if available
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'purchase_quote_intent', {
          value: grandTotal,
          currency: 'INR',
          items: cartItems.map(i => ({
            item_id: i.sku || i.id,
            item_name: i.name,
            quantity: i.quantity,
            price: i.base_price
          }))
        });
      }
    } catch (err) {
      console.error('Multi-Product RFQ Submission error:', err);
      setErrorMessage(err.message || 'Failed to submit commercial RFQ. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Procurement Cart & Multi-Product RFQ" 
        description="Review your commercial steel cart, calculate 18% GST and tonnage totals, and dispatch multi-product RFQs directly to Urbanspan sales desk."
      />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-steel mb-1">
              <ShoppingBag className="w-4 h-4" /> Commercial Steel Procurement Cart
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Buyer Cart & RFQ Dispatch
            </h1>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-steel hover:border-brand-steel text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Browsing Catalog
          </Link>
        </div>

        {submitted ? (
          /* Submission Success State */
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-xl max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs tracking-wider uppercase inline-block mb-3">
              RFQ Dispatch Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              Multi-Product Commercial RFQ Transmitted!
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed mb-6">
              Thank you for trusting Urbanspan Infrastructure. Your bulk multi-tonnage consignment inquiry has been ingested into our Distro App CRM Sales Desk. A dedicated Key Account Manager will calculate final mill rolling schedules, mill test certificates, and dispatch your proforma contract quote shortly.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto mb-8 text-left space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Inquiry Reference:</span>
                <strong className="text-slate-900 font-mono">{submittedSummary?.referenceId || `RFQ-CONSIGNMENT-${Date.now().toString().slice(-6)}`}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Buyer Organization:</span>
                <strong className="text-slate-900">{submittedSummary?.company || buyerInfo.company || buyerInfo.name}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Total Consignment:</span>
                <strong className="text-brand-steel">{submittedSummary?.quantity ?? totalQuantity} Metric Tons</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/portal"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" /> Track in Customer Portal
              </Link>
              <Link
                to="/products"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-sm transition-all"
              >
                Browse Steel Catalog
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Your Procurement Cart is Empty</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
              You haven't added any structural steel products or TMT rebars yet. Add items from our catalog to compare rates, calculate 18% GST, and dispatch combined multi-product RFQs.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-primary text-slate-900 font-extrabold text-sm shadow-lg shadow-brand-steel/20 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <span>Explore Commercial Steel Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Enquired Products ({totalCount} items • {totalQuantity} MT Total)
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>

              {cartItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5"
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold text-brand-steel uppercase tracking-wider block">
                            {item.category}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Benchmark Rate & 18% Tax Badge */}
                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-black text-slate-800">
                          ₹{Number(item.base_price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          / {item.unit || 'MT'} (ex-plant)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          + 18% GST (₹{Math.round(item.base_price * 0.18).toLocaleString('en-IN')}/MT)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Tonnage Selector */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Tonnage:</span>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 5))}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                            className="w-14 text-center bg-transparent text-slate-900 font-black text-xs focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-400 font-bold pr-2">MT</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 5)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick MT presets */}
                      <div className="flex items-center gap-1">
                        {[25, 50, 100].map((mt) => (
                          <button
                            key={mt}
                            type="button"
                            onClick={() => handleTonnagePreset(item.id, mt)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              item.quantity === mt 
                                ? 'bg-brand-steel text-white border-brand-steel shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {mt} MT
                          </button>
                        ))}
                      </div>

                      {/* Line Item Estimated Total */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Line Total (incl. 18% GST)</span>
                        <span className="text-sm font-black text-brand-steel">
                          ₹{Math.round(item.lineTotal).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary & Dispatch Form */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Pricing & 18% GST Breakdown Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Consignment Valuation</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{totalQuantity} MT Total</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Material Subtotal (ex-plant):</span>
                    <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Applicable GST @ 18% (HSN 7214):
                    </span>
                    <span className="font-black font-mono">₹{Math.round(totalGst).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900 block">Total Estimated Value</span>
                      <span className="text-[11px] text-slate-400 font-medium">(Base Material + 18% GST)</span>
                    </div>
                    <span className="text-2xl font-black text-brand-steel">
                      ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Tax & Logistics Notice:</span> Official invoice carries statutory 18% GST. Transportation freight, weighbridge toll slips, and transit insurance are calculated upon dispatch destination confirmation.
                </div>
              </div>

              {/* Multi-Product RFQ Direct Submission Form */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg">
                <div className="mb-4">
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-brand-steel" /> Dispatch RFQ to Sales Desk
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Route all {totalCount} items ({totalQuantity} MT) directly to CRM sales engineers for immediate proforma pricing.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitMultiRFQ} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={buyerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Company / Contractor *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chandra Infra Ltd"
                        value={buyerInfo.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={buyerInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Business Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="buyer@infraprojects.com"
                      value={buyerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" /> Delivery Destination (City / State / Pincode)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Indore Ring Road Project Site / Pithampur SEZ"
                      value={buyerInfo.delivery_location}
                      onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Project Specifications / Delivery Timeline
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Specify bend test requirements, preferred mill rolling schedule, or test certificate needs..."
                      value={buyerInfo.site_notes}
                      onChange={(e) => handleInputChange('site_notes', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-steel"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-primary text-slate-900 font-black text-sm shadow-lg shadow-brand-steel/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Transmitting Multi-Product RFQ...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit RFQ for All {totalCount} Products ({totalQuantity} MT)</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
