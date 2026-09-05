import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  Building2, Truck, CheckCircle2, AlertCircle, Send, 
  ArrowLeft, RefreshCw, Table, ChevronDown, ChevronUp,
  Paperclip, FileSpreadsheet, FileText, UploadCloud, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { submitDynamicFormByName } from '../services/headlessApi';
import { 
  getProductUnit, 
  getQuantityPresets, 
  isSectionMatrixEligible, 
  formatCartTotalQuantities,
  getProductAvailableSizes,
  getProductMatrixTitle
} from '../utils/productUtils';
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

  const [openMatrices, setOpenMatrices] = useState({});
  const [itemMatrices, setItemMatrices] = useState({});
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);

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

  const toggleMatrix = (itemId) => {
    setOpenMatrices(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Update a dynamic size/gauge in an item's matrix
  const handleGaugeChange = (item, gauge, val) => {
    const itemId = item.id;
    const itemSizes = getProductAvailableSizes(item);
    setItemMatrices(prev => {
      const currentItemMatrix = prev[itemId] || {};
      const updated = {
        ...currentItemMatrix,
        [gauge]: val
      };

      let sum = 0;
      itemSizes.forEach(g => {
        const num = parseFloat(updated[g]);
        if (!isNaN(num) && num > 0) sum += num;
      });

      const customRows = updated.customRows || [];
      customRows.forEach(r => {
        const num = parseFloat(r.qty);
        if (!isNaN(num) && num > 0) sum += num;
      });

      if (sum > 0) {
        updateQuantity(itemId, sum);
      }

      return {
        ...prev,
        [itemId]: updated
      };
    });
  };

  // Add custom section profile row to an item's matrix
  const handleAddCustomRow = (itemId) => {
    setItemMatrices(prev => {
      const current = prev[itemId] || {};
      const customRows = current.customRows || [];
      return {
        ...prev,
        [itemId]: {
          ...current,
          customRows: [...customRows, { section: '', qty: '' }]
        }
      };
    });
  };

  // Update custom section profile row
  const handleCustomRowChange = (item, idx, field, val) => {
    const itemId = item.id;
    const itemSizes = getProductAvailableSizes(item);
    setItemMatrices(prev => {
      const current = prev[itemId] || {};
      const customRows = [...(current.customRows || [])];
      customRows[idx] = { ...customRows[idx], [field]: val };

      let sum = 0;
      itemSizes.forEach(g => {
        const num = parseFloat(current[g]);
        if (!isNaN(num) && num > 0) sum += num;
      });
      customRows.forEach(r => {
        const num = parseFloat(r.qty);
        if (!isNaN(num) && num > 0) sum += num;
      });

      if (sum > 0) {
        updateQuantity(itemId, sum);
      }

      return {
        ...prev,
        [itemId]: {
          ...current,
          customRows
        }
      };
    });
  };

  // Remove custom section profile row
  const handleRemoveCustomRow = (item, idx) => {
    const itemId = item.id;
    const itemSizes = getProductAvailableSizes(item);
    setItemMatrices(prev => {
      const current = prev[itemId] || {};
      const customRows = (current.customRows || []).filter((_, i) => i !== idx);

      let sum = 0;
      itemSizes.forEach(g => {
        const num = parseFloat(current[g]);
        if (!isNaN(num) && num > 0) sum += num;
      });
      customRows.forEach(r => {
        const num = parseFloat(r.qty);
        if (!isNaN(num) && num > 0) sum += num;
      });

      if (sum > 0) {
        updateQuantity(itemId, sum);
      }

      return {
        ...prev,
        [itemId]: {
          ...current,
          customRows
        }
      };
    });
  };

  // File Upload Handling
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setFileError(null);
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB limit

    files.forEach(file => {
      if (file.size > MAX_SIZE) {
        setFileError(`File "${file.name}" exceeds the maximum 15MB upload limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles(prev => [
          ...prev,
          {
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            data_url: reader.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Format matrix summary for display
  const getItemMatrixSummary = (item, unit) => {
    if (!item) return null;
    const itemId = item.id;
    const mat = itemMatrices[itemId];
    if (!mat) return null;

    const itemSizes = getProductAvailableSizes(item);
    const parts = [];
    itemSizes.forEach(g => {
      const num = parseFloat(mat[g]);
      if (!isNaN(num) && num > 0) parts.push(`${g}: ${num} ${unit}`);
    });
    (mat.customRows || []).forEach(r => {
      const num = parseFloat(r.qty);
      if (r.section && !isNaN(num) && num > 0) parts.push(`${r.section}: ${num} ${unit}`);
    });

    return parts.length > 0 ? parts.join(', ') : null;
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
      // Build composed items notes
      const itemsSummaryLines = cartItems.map((item, idx) => {
        const unit = getProductUnit(item);
        const matSummary = getItemMatrixSummary(item, unit);
        let line = `  ${idx + 1}. ${item.name} - ${item.quantity} ${unit} @ ₹${Number(item.base_price).toLocaleString('en-IN')}/${unit}`;
        if (matSummary) {
          line += `\n     Section Matrix: [${matSummary}]`;
        }
        return line;
      });

      const formattedTotalUnits = formatCartTotalQuantities(cartItems);

      const composedNotes = `Multi-Product Procurement Cart RFQ (${formattedTotalUnits} Total Consignment):\n` +
        itemsSummaryLines.join('\n') +
        `\nDestination Location: ${buyerInfo.delivery_location || 'Not specified'}` +
        `\nSite Notes: ${buyerInfo.site_notes || 'Standard Delivery'}` +
        (attachedFiles.length > 0 ? `\nAttached Documents: ${attachedFiles.map(f => f.file_name).join(', ')}` : '');

      const payload = {
        name: buyerInfo.name,
        company: buyerInfo.company,
        email: buyerInfo.email,
        phone: buyerInfo.phone,
        source: 'buyer_cart_rfq',
        quantity: totalQuantity,
        expected_value: subtotal,
        notes: composedNotes,
        attachments: attachedFiles,
        custom_data: {
          delivery_location: buyerInfo.delivery_location,
          site_notes: buyerInfo.site_notes,
          total_tonnage: totalQuantity,
          formatted_total_units: formattedTotalUnits,
          base_subtotal: subtotal,
          gst_18_amount: totalGst,
          grand_total_with_tax: grandTotal,
          items_count: totalCount,
          attachments: attachedFiles,
          items: cartItems.map(item => {
            const unit = getProductUnit(item);
            return {
              product_id: item.id,
              sku: item.sku,
              product_name: item.name,
              category: item.category,
              quantity: item.quantity,
              base_price: item.base_price,
              unit,
              section_matrix: itemMatrices[item.id] || null,
              line_subtotal: item.lineSubtotal,
              gst_18: item.lineGst,
              line_total: item.lineTotal
            };
          })
        },
        items: cartItems.map(item => {
          const unit = getProductUnit(item);
          return {
            product_id: item.id,
            sku: item.sku,
            product_name: item.name,
            category: item.category,
            quantity: item.quantity,
            base_price: item.base_price,
            unit,
            section_matrix: itemMatrices[item.id] || null,
            line_subtotal: item.lineSubtotal,
            gst_18: item.lineGst,
            line_total: item.lineTotal
          };
        })
      };

      const res = await submitDynamicFormByName('lead_capture', payload);
      setLeadResult(res?.data || res);
      const generatedRefId = res?.data?.reference_id || `RFQ-CONSIGNMENT-${Date.now().toString().slice(-6)}`;
      setSubmittedSummary({
        quantity: formattedTotalUnits,
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

  const formattedTotalQuantity = formatCartTotalQuantities(cartItems);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Procurement Cart & Multi-Product RFQ" 
        description="Review your commercial steel cart, calculate 18% GST and tonnage totals, break down section matrices, and dispatch multi-product RFQs directly to Urbanspan sales desk."
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
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-xl max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs tracking-wide uppercase inline-block mb-3">
              Request Received
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              Thank You! We've Received Your Request
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Our team is reviewing your requirements and will share the best quotation with you shortly via WhatsApp and email.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto mb-8 text-left space-y-2.5">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Reference ID:</span>
                <strong className="text-slate-900 font-mono">{submittedSummary?.referenceId || `RFQ-${Date.now().toString().slice(-6)}`}</strong>
              </div>
              {(submittedSummary?.company || buyerInfo?.company || buyerInfo?.name) && (
                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                  <span>Buyer:</span>
                  <strong className="text-slate-900">{submittedSummary?.company || buyerInfo?.company || buyerInfo?.name}</strong>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Total Quantity:</span>
                <strong className="text-brand-steel">{submittedSummary?.quantity || formattedTotalQuantity}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/portal"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" /> View My Inquiries
              </Link>
              <Link
                to="/products"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-sm transition-all"
              >
                Continue Browsing
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
              You haven't added any structural steel products or TMT rebars yet. Add items from our catalog to compare rates, calculate 18% GST, customize section matrices, and dispatch combined multi-product RFQs.
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
                  Enquired Products ({totalCount} {totalCount === 1 ? 'item' : 'items'} • {formattedTotalQuantity} Total)
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>

              {cartItems.map((item) => {
                const itemUnit = getProductUnit(item);
                const isMatrixEligible = isSectionMatrixEligible(item);
                const itemSizes = getProductAvailableSizes(item);
                const matrixTitle = getProductMatrixTitle(item);
                const isMatrixOpen = Boolean(openMatrices[item.id]);
                const matrixSummary = getItemMatrixSummary(item, itemUnit);
                const curMatrix = itemMatrices[item.id] || {};

                return (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
                  >
                    {/* Top Row: Thumbnail + Details */}
                    <div className="flex flex-col sm:flex-row gap-5">
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
                          {Number(item.base_price) > 0 ? (
                            <div className="mt-2 flex flex-wrap items-baseline gap-2">
                              <span className="text-sm font-black text-slate-800">
                                ₹{Number(item.base_price).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                / {itemUnit} (ex-plant)
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                + 18% GST (₹{Math.round(item.base_price * 0.18).toLocaleString('en-IN')}/{itemUnit})
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                Price on Request (Spot Mill Benchmark Rate)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quantity & Preset Selector */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Quantity:</span>
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, Math.max(0.001, Number((item.quantity - (itemUnit.toLowerCase() === 'kg' ? 25 : 5)).toFixed(3))))}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, Math.max(0.001, Number(e.target.value)))}
                                className="w-16 text-center bg-transparent text-slate-900 font-black text-xs focus:outline-none"
                              />
                              <span className="text-[11px] text-slate-400 font-bold pr-2">{itemUnit}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + (itemUnit.toLowerCase() === 'kg' ? 25 : 5))}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Unit Presets */}
                          <div className="flex items-center gap-1">
                            {getQuantityPresets(item).slice(0, 3).map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => handleTonnagePreset(item.id, qty)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  item.quantity === qty 
                                    ? 'bg-brand-steel text-white border-brand-steel shadow-xs' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {qty} {itemUnit}
                              </button>
                            ))}
                          </div>

                          {/* Line Item Estimated Total */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Line Total (incl. 18% GST)</span>
                            {Number(item.base_price) > 0 ? (
                              <span className="text-sm font-black text-brand-steel">
                                ₹{Math.round(item.lineTotal).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                                Spot Rate on Quote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Matrix Toggle Button (For Rebar & Structural Steel) */}
                    {isMatrixEligible && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMatrix(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 text-xs font-bold transition-all"
                          >
                            <Table className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isMatrixOpen ? 'Hide Section Matrix' : matrixTitle}</span>
                            {isMatrixOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 ml-1" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 ml-1" />
                            )}
                          </button>

                          {matrixSummary && !isMatrixOpen && (
                            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold truncate max-w-xs sm:max-w-md">
                              Allocated: {matrixSummary}
                            </span>
                          )}
                        </div>

                        {/* Expandable Section Matrix Accordion Body */}
                        {isMatrixOpen && (
                          <div className="mt-3 p-4 bg-slate-50/80 rounded-2xl border border-indigo-100 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {itemUnit.toLowerCase() === 'kg' ? 'Gauge / Wire Allocation' : 'Gauge / Diameter Allocation'} ({itemUnit})
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Entering values auto-sums into required {itemUnit}
                              </span>
                            </div>

                            {/* Dynamic Standard Gauges Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {itemSizes.map(gauge => (
                                <div key={gauge} className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                                  <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                                    {gauge}
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      placeholder="0"
                                      value={curMatrix[gauge] || ''}
                                      onChange={(e) => handleGaugeChange(item, gauge, e.target.value)}
                                      className="w-full px-2 py-1 bg-slate-50 rounded-lg text-xs font-black text-slate-800 border border-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">{itemUnit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Custom Profile Rows */}
                            {(curMatrix.customRows || []).map((row, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                                <input
                                  type="text"
                                  placeholder="e.g. 36mm / 40mm / ISMB 300"
                                  value={row.section}
                                  onChange={(e) => handleCustomRowChange(item, rIdx, 'section', e.target.value)}
                                  className="flex-1 px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-1 w-28">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="0"
                                    value={row.qty}
                                    onChange={(e) => handleCustomRowChange(item, rIdx, 'qty', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 rounded-lg text-xs font-black text-slate-800 border border-slate-200 focus:outline-none focus:border-indigo-500"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">{itemUnit}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomRow(item, rIdx)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Remove section row"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddCustomRow(item.id)}
                              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Custom Gauge / Section Profile Row
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Order Summary & Dispatch Form */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Pricing & 18% GST Breakdown Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Consignment Valuation</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{formattedTotalQuantity} Total</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Material Subtotal (ex-plant):</span>
                    <span className="font-bold text-slate-900">
                      ₹{subtotal.toLocaleString('en-IN')}{cartItems.some(i => !i.base_price || Number(i.base_price) <= 0) ? ' + Spot Rates' : ''}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Applicable GST @ 18% (HSN 7214):
                    </span>
                    <span className="font-black font-mono">
                      ₹{Math.round(totalGst).toLocaleString('en-IN')}{cartItems.some(i => !i.base_price || Number(i.base_price) <= 0) ? ' + GST' : ''}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900 block">Total Estimated Value</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cartItems.some(i => !i.base_price || Number(i.base_price) <= 0) ? '(Calculated Items + Pending Spot Rates)' : '(Base Material + 18% GST)'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-brand-steel">
                      ₹{Math.round(grandTotal).toLocaleString('en-IN')}{cartItems.some(i => !i.base_price || Number(i.base_price) <= 0) ? '*' : ''}
                    </span>
                  </div>
                </div>

                {cartItems.some(i => !i.base_price || Number(i.base_price) <= 0) && (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Spot Rates Pending:</strong> One or more items in your cart are subject to daily mill benchmark spot pricing. The sales desk will calculate verified live rates upon quotation review.
                    </span>
                  </div>
                )}

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
                    Submit all {totalCount} {totalCount === 1 ? 'item' : 'items'} ({formattedTotalQuantity}) for immediate proforma pricing.
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

                  {/* Document / BOQ Uploader Dropzone */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-brand-steel" />
                      <span>Attach BOQ / Section Matrix / Drawings (Optional)</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-200 hover:border-brand-steel/60 rounded-2xl p-4 text-center transition-all bg-slate-50/50 hover:bg-slate-50">
                      <input 
                        type="file" 
                        id="cart-boq-upload" 
                        multiple 
                        accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <label htmlFor="cart-boq-upload" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-brand-steel flex items-center justify-center">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          Click to upload or drag & drop files
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Excel (.xlsx, .csv), PDF Drawings, or Word specs up to 15MB
                        </div>
                      </label>
                    </div>

                    {fileError && (
                      <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fileError}
                      </p>
                    )}

                    {attachedFiles.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {attachedFiles.map((f, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-xl text-xs border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              {f.file_name.endsWith('.xlsx') || f.file_name.endsWith('.csv') ? (
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-brand-steel shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800 truncate">{f.file_name}</span>
                              <span className="text-[10px] text-slate-400">({(f.file_size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFile(fIdx)} 
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-3 py-4 px-6 rounded-2xl bg-gradient-primary text-slate-900 font-black text-sm shadow-lg shadow-brand-steel/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Transmitting Multi-Product RFQ...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit RFQ for All {totalCount} {totalCount === 1 ? 'Product' : 'Products'} ({formattedTotalQuantity})</span>
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
