import React, { useState, useEffect } from 'react';
import { 
  Send, CheckCircle2, AlertCircle, Sparkles, Package, Calculator, 
  Upload, FileSpreadsheet, FileText, X, Paperclip, Table, Plus, 
  Trash2, ChevronDown, ChevronUp, Check, Layers 
} from 'lucide-react';
import { getFormSchemaByName, submitDynamicFormByName, fetchSteelProducts } from '../services/headlessApi';
import { getProductUnit, getQuantityPresets, getUnitRateLabel } from '../utils/productUtils';

const DEFAULT_TMT_GAUGES = ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '28mm', '32mm'];

export default function DynamicForm({ formName, title, subtitle, icon: Icon, defaultValues = {}, customerUser, isPageHeading = false }) {
  const [schema, setSchema] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Section Matrix State
  const [showSectionMatrix, setShowSectionMatrix] = useState(false);
  const [sectionMatrix, setSectionMatrix] = useState({
    '8mm': '',
    '10mm': '',
    '12mm': '',
    '16mm': '',
    '20mm': '',
    '25mm': '',
    '28mm': '',
    '32mm': ''
  });
  const [customSectionRows, setCustomSectionRows] = useState([]);

  // File Attachments State (BOQ / Drawings / Schedules)
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);

  // Load products list and form schema
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [schemaData, productsData] = await Promise.all([
          getFormSchemaByName(formName).catch(() => ({ name: 'Commercial Steel RFQ Submission', fields: [] })),
          fetchSteelProducts().catch(() => [])
        ]);

        setSchema(schemaData || { name: 'Commercial Steel RFQ Submission', fields: [] });
        setProducts(productsData || []);

        const initialData = { ...defaultValues };

        // If a preselected product is passed or defaultValues has product_id
        if (defaultValues.preselectedProduct) {
          initialData.product_id = defaultValues.preselectedProduct.id;
          initialData.product_name = defaultValues.preselectedProduct.name;
          initialData.sku = defaultValues.preselectedProduct.sku;
          initialData.benchmark_rate = defaultValues.preselectedProduct.base_price;
          initialData.unit = getProductUnit(defaultValues.preselectedProduct);
        } else if (defaultValues.product_id && productsData.length > 0) {
          const match = productsData.find(p => p.id === defaultValues.product_id || p.sku === defaultValues.product_id);
          if (match) {
            initialData.product_id = match.id;
            initialData.product_name = match.name;
            initialData.sku = match.sku;
            initialData.benchmark_rate = match.base_price;
            initialData.unit = getProductUnit(match);
          }
        }

        const resolvedUnit = initialData.unit || 'MT';
        const isKg = resolvedUnit.toLowerCase() === 'kg';

        // Set default quantity if not provided
        if (!initialData.quantity) {
          initialData.quantity = isKg ? 100 : 50;
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
  const currentUnit = getProductUnit(selectedProduct || { unit: formData.unit });
  const isKg = currentUnit.toLowerCase() === 'kg' || currentUnit.toLowerCase() === 'kgs';
  const isNos = currentUnit.toLowerCase() === 'nos' || currentUnit.toLowerCase() === 'pcs' || currentUnit.toLowerCase() === 'bundle';
  
  const currentBasePrice = Number(selectedProduct?.base_price || formData.benchmark_rate) || 0;
  const currentQuantity = Number(formData.quantity) || 0;
  const computedTotal = currentBasePrice * currentQuantity;

  // Preset chips based on unit
  const presetChips = isKg ? [50, 100, 250, 500, 1000, 5000] : isNos ? [10, 25, 50, 100, 250, 500] : [15, 25, 30, 50, 100, 250, 500];

  const handleProductChange = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const price = Number(prod.base_price) || 0;
      const pUnit = getProductUnit(prod);
      const pIsKg = pUnit.toLowerCase() === 'kg';
      const pIsNos = pUnit.toLowerCase() === 'nos' || pUnit.toLowerCase() === 'pcs';
      
      let newQty = Number(formData.quantity) || 50;
      if (pIsKg && (newQty < 25 || newQty === 50)) newQty = 100;
      if (!pIsKg && !pIsNos && newQty > 500) newQty = 50;

      setFormData(prev => ({
        ...prev,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        unit: pUnit,
        quantity: newQty,
        benchmark_rate: price,
        expected_value: price > 0 ? price * newQty : prev.expected_value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        product_id: '',
        product_name: 'General Steel Inquiries',
        sku: '',
        unit: 'MT',
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

  // Section Matrix change handler
  const handleGaugeChange = (gaugeKey, val) => {
    const updated = { ...sectionMatrix, [gaugeKey]: val };
    setSectionMatrix(updated);

    // Sum standard gauges + custom rows
    let sum = 0;
    Object.values(updated).forEach(v => {
      const num = parseFloat(v);
      if (!isNaN(num) && num > 0) sum += num;
    });
    customSectionRows.forEach(r => {
      const num = parseFloat(r.quantity);
      if (!isNaN(num) && num > 0) sum += num;
    });

    if (sum > 0) {
      handleQuantityChange(sum);
    }
  };

  const handleAddCustomRow = () => {
    setCustomSectionRows(prev => [...prev, { id: `row_${Date.now()}`, size: '', quantity: '' }]);
  };

  const handleCustomRowChange = (id, field, val) => {
    setCustomSectionRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: val } : r);
      let sum = 0;
      Object.values(sectionMatrix).forEach(v => {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) sum += num;
      });
      updated.forEach(r => {
        const num = parseFloat(r.quantity);
        if (!isNaN(num) && num > 0) sum += num;
      });
      if (sum > 0) {
        handleQuantityChange(sum);
      }
      return updated;
    });
  };

  const handleRemoveCustomRow = (id) => {
    setCustomSectionRows(prev => prev.filter(r => r.id !== id));
  };

  // File Upload Handler
  const handleFileSelect = (e) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 15 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds 15MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: event.target.result
          }
        ]);
      };
      reader.onerror = () => {
        setFileError(`Failed to read file "${file.name}".`);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleRemoveFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      // Build active section matrix
      const activeMatrix = {};
      Object.entries(sectionMatrix).forEach(([k, v]) => {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) activeMatrix[k] = num;
      });
      customSectionRows.forEach(r => {
        const num = parseFloat(r.quantity);
        if (r.size && !isNaN(num) && num > 0) activeMatrix[r.size] = num;
      });

      const payloadToSubmit = {
        ...formData,
        product_id: formData.product_id || selectedProduct?.id || null,
        product_name: formData.product_name || selectedProduct?.name || null,
        sku: formData.sku || selectedProduct?.sku || null,
        unit: currentUnit,
        quantity: (!isNaN(parseFloat(formData.quantity)) && parseFloat(formData.quantity) > 0) ? parseFloat(formData.quantity) : 1,
        expected_value: computedTotal > 0 ? computedTotal : (Number(formData.expected_value) || null),
        section_matrix: Object.keys(activeMatrix).length > 0 ? activeMatrix : null,
        attachments: attachedFiles.map(f => ({
          file_name: f.name,
          file_size: f.size,
          mime_type: f.type,
          data_url: f.dataUrl,
          is_section_matrix: true
        }))
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
        {isPageHeading ? (
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{title || schema?.name || 'Commercial Steel RFQ'}</h1>
        ) : (
          <h2 className="text-3xl font-extrabold text-slate-900">{title || schema?.name || 'Commercial Steel RFQ'}</h2>
        )}
        {subtitle && <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">{subtitle}</p>}
      </div>

      {submitted ? (
        <div className="bg-white shadow-xl border border-emerald-500/30 bg-emerald-50/20 p-10 rounded-3xl text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-slate-900">Commercial RFQ Transmitted!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Thank you for contacting Urbanspan Infrastructure. Your inquiry has been received. Our sales desk will issue your official proforma rate quote shortly.
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
                  Benchmark: ₹{currentBasePrice.toLocaleString('en-IN')}/{currentUnit}
                </span>
              )}
            </div>

            <select
              value={formData.product_id || selectedProduct?.id || ''}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:border-brand-steel transition-colors"
            >
              <option value="">General Steel RFQ / Custom Specification</option>
              {products.map((p) => {
                const pU = getProductUnit(p);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.base_price ? `— ₹${Number(p.base_price).toLocaleString('en-IN')}/${pU}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quantity / Tonnage Input with Dynamic Unit Quick Chips */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-brand-steel" /> Required Quantity ({currentUnit.toUpperCase()}) *
              </label>
              <span className="text-xs text-slate-500 font-medium">Bulk dispatch in {currentUnit}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="number"
                min="0.001"
                step="any"
                required
                placeholder={`e.g. ${isKg ? '100' : '50'}`}
                value={formData.quantity || ''}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full sm:w-48 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-black text-base focus:outline-none focus:border-brand-steel transition-colors"
              />

              {/* Dynamic Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {presetChips.map((t) => (
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
                    {t} {currentUnit}
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
                    <span>Estimated Base Subtotal ({currentQuantity} {currentUnit} @ ₹{currentBasePrice.toLocaleString('en-IN')}/{currentUnit}):</span>
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

          {/* Section Matrix & Size Breakdown Builder (Interactive Accordion) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Detailed Section / Size Breakdown (Section Matrix)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Specify exact gauge/diameter quantities (e.g. 8mm, 10mm, 12mm) or structural profiles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionMatrix(!showSectionMatrix)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all border border-indigo-200"
              >
                <span>{showSectionMatrix ? 'Collapse Matrix' : '📐 Open Matrix'}</span>
                {showSectionMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showSectionMatrix && (
              <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4">
                {/* Standard TMT / Rebar Gauges */}
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Standard Diameter / Gauges ({currentUnit}):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {DEFAULT_TMT_GAUGES.map((gauge) => (
                      <div key={gauge} className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                          {gauge}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={sectionMatrix[gauge] || ''}
                          onChange={(e) => handleGaugeChange(gauge, e.target.value)}
                          className="w-full text-xs font-bold text-slate-900 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Section / Profile Rows */}
                {customSectionRows.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Additional Custom Sections / Specs:
                    </div>
                    {customSectionRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <input
                          type="text"
                          placeholder="e.g. ISMB 150 / ISA 50x50x6 / 36mm"
                          value={row.size}
                          onChange={(e) => handleCustomRowChange(row.id, 'size', e.target.value)}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="w-32 flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) => handleCustomRowChange(row.id, 'quantity', e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                          />
                          <span className="text-[10px] font-bold text-slate-400">{currentUnit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRow(row.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Custom Section Row
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOQ / Drawing / Schedule File Attachment Dropzone */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Paperclip className="w-4 h-4 text-brand-steel" /> Attach BOQ / Section Schedule / Drawings (Optional)
              </label>
            </div>

            <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-brand-steel rounded-2xl bg-white cursor-pointer transition-all hover:bg-slate-50/50 group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-steel transition-colors mb-2" />
              <p className="text-xs font-bold text-slate-700 group-hover:text-brand-steel">
                Click to upload or drag & drop Section Matrix / BOQ file
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports Excel (.xlsx, .xls), PDF (.pdf), Word (.docx), CSV, or Image drawings (Up to 15MB)
              </p>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.pdf,.csv,.doc,.docx,.png,.jpg,.jpeg,.dwg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {fileError && (
              <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {fileError}
              </p>
            )}

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Attached Documents ({attachedFiles.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => {
                    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs text-xs"
                      >
                        {isExcel ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
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
            {submitting ? 'Submitting Commercial RFQ...' : 'Submit Commercial Steel RFQ'} <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
