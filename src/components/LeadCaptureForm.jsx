import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Building, Mail, Phone, User, DollarSign, FileText, Sparkles, Truck, MapPin } from 'lucide-react';
import { submitRFQLead } from '../services/headlessApi';

export default function LeadCaptureForm({ preselectedProduct, customerUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    expected_value: '',
    source: 'urbanspan_website',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let newNotes = formData.notes;
    if (preselectedProduct) {
      newNotes = `Commercial RFQ for Product: ${preselectedProduct.name} (SKU: ${preselectedProduct.sku}). Estimated Tonnage Required: 100 MT.`;
    }
    setFormData((prev) => ({
      ...prev,
      notes: newNotes,
      ...(customerUser && {
        name: customerUser.name,
        email: customerUser.email,
        company: customerUser.company,
      })
    }));
  }, [preselectedProduct, customerUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitRFQLead({
        ...formData,
        expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.error || 'Failed to submit RFQ. Please check connection/API configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Direct CRM Sales Pipeline Capture
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Commercial Steel RFQ Submission</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
          Submit your bulk tonnage, grade specifications, and delivery destination below for instant quote dispatch by Urbanspan sales engineers.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white shadow-lg border border-slate-200 p-10 rounded-3xl text-center border border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-slate-900">Steel RFQ Received Successfully!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Thank you for contacting Urbanspan Infrastructure. A dedicated key account manager has been assigned to your inquiry in Distro App CRM and will issue your formal proforma quote shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', phone: '', company: '', expected_value: '', source: 'urbanspan_website', notes: '' });
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-white-light hover:bg-slate-700 text-slate-900 font-semibold text-xs"
          >
            Submit Another RFQ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-lg border border-slate-200 p-8 sm:p-10 rounded-3xl space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {preselectedProduct && (
            <div className="p-4 rounded-xl bg-brand-steel/10 border border-brand-steel/20 text-blue-300 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold block">Inquiring for: {preselectedProduct.name}</span>
                {preselectedProduct.base_price ? (
                  <span className="text-slate-500">Benchmark Price: ₹{Number(preselectedProduct.base_price).toLocaleString('en-IN')} / Metric Ton</span>
                ) : (
                  <span className="text-slate-500">Price on Request</span>
                )}
              </div>
            </div>
          )}

          {customerUser ? (
            <div className="p-5 rounded-2xl bg-white/80 border border-brand-steel/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-steel/20 flex items-center justify-center border border-brand-steel/40">
                <User className="w-6 h-6 text-brand-steel-light" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Submitting On Behalf Of</span>
                <span className="text-base text-slate-900 font-bold block">{customerUser.name}</span>
                <span className="text-sm text-slate-500">{customerUser.company} • {customerUser.email}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-steel-light" /> Commercial Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Khurana"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-brand-steel-light" /> Company / Infrastructure Org *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Larsen & Infra Projects Ltd"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-steel-light" /> Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rkhurana@larseninfra.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-steel-light" /> Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="+91 98200 11223"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Estimated Order Value (INR)
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 5000000 (50 Lakhs)"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-steel-light" /> Tonnage Specs & Delivery Site Address
            </label>
            <textarea
              rows={4}
              placeholder="Specify required tonnage (e.g., 200 MT Fe-550D TMT 16mm & 25mm), project site location (e.g. Navi Mumbai Metro Site), and required dispatch schedule..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-primary hover:opacity-95 text-slate-900 font-black text-sm shadow-xl shadow-brand-steel/20 flex items-center justify-center gap-2 transition-all"
          >
            {submitting ? 'Dispatching to CRM...' : 'Submit Commercial RFQ'} <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
