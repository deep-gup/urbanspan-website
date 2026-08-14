import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { getFormSchemaByName, submitDynamicFormByName } from '../services/headlessApi';

export default function DynamicForm({ formName, title, subtitle, icon: Icon, defaultValues = {}, customerUser }) {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function loadSchema() {
      try {
        setLoading(true);
        const data = await getFormSchemaByName(formName);
        setSchema(data);
        
        // Initialize form data with defaults
        const initialData = { ...defaultValues };
        data.fields.forEach(f => {
          if (initialData[f.name] === undefined) {
            initialData[f.name] = '';
          }
        });
        setFormData(initialData);
      } catch (err) {
        setErrorMessage('Failed to load form configuration.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (formName) {
      loadSchema();
    } else {
      setLoading(false);
      setErrorMessage("No Form Name provided.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitDynamicFormByName(formName, formData);
      setSubmitted(true);
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
          <div className="w-12 h-12 bg-white-light rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-white-light rounded mb-4"></div>
          <div className="h-4 w-64 bg-white-light rounded"></div>
        </div>
      </div>
    );
  }

  if (errorMessage && !schema) {
    return (
      <div className="py-16 max-w-4xl mx-auto px-4 text-center">
         <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        {Icon && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-steel/10 text-brand-steel-light border border-brand-steel/20 text-xs font-semibold mb-3">
            <Icon className="w-3.5 h-3.5" /> Urbanspan Gateway
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-slate-900">{title || schema?.name || 'Inquiry Form'}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">{subtitle}</p>}
      </div>

      {submitted ? (
        <div className="bg-white shadow-lg border border-slate-200 p-10 rounded-3xl text-center border border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-slate-900">Received Successfully!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Thank you for contacting Urbanspan Infrastructure. Your submission has been securely routed to our CRM system and a team member will be in touch shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              const initialData = { ...defaultValues };
              schema.fields.forEach(f => {
                if (initialData[f.name] === undefined) initialData[f.name] = '';
              });
              setFormData(initialData);
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-white-light hover:bg-slate-700 text-slate-900 font-semibold text-xs transition-colors"
          >
            Submit Another
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

          {customerUser && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-4 mb-2">
               <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg border border-indigo-500/30">
                 {customerUser.name?.charAt(0).toUpperCase()}
               </div>
               <div>
                 <p className="text-sm text-indigo-300 font-medium">Submitting securely on behalf of</p>
                 <p className="text-lg font-bold text-indigo-100">{customerUser.name}</p>
                 <p className="text-xs text-indigo-400/70 mt-0.5">{customerUser.email} {customerUser.company ? `• ${customerUser.company}` : ''}</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {schema?.fields?.map((field) => {
              if (customerUser && ['name', 'email', 'company'].includes(field.name)) {
                return null;
              }
              return (
                <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel transition-colors"
                  />
                )}
              </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-primary hover:opacity-95 text-slate-900 font-black text-sm shadow-xl shadow-brand-steel/20 flex items-center justify-center gap-2 transition-all"
          >
            {submitting ? 'Transmitting to CRM...' : 'Submit Form'} <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
