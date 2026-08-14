import React, { useState } from 'react';
import { Settings, Save, X, Key, Globe, Shield } from 'lucide-react';
import { getStoredConfig, saveStoredConfig } from '../services/headlessApi';

export default function ApiConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getStoredConfig());
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveStoredConfig(config);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white shadow-lg border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white-light"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-steel flex items-center justify-center text-slate-900 font-black">
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Urbanspan ERP API Settings</h3>
            <p className="text-xs text-slate-500">Configure connection to Distro App headless backend</p>
          </div>
        </div>

        {savedMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-4 text-center font-semibold">
            Settings saved! Reloading application...
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-steel-light" /> Backend URL (Cloud Run or Local)
            </label>
            <input
              type="text"
              required
              value={config.apiBaseUrl}
              onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand-steel-light" /> API Key (x-api-key)
            </label>
            <input
              type="text"
              required
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-steel-light" /> Organization Code (x-org-code)
            </label>
            <input
              type="text"
              required
              value={config.orgCode}
              onChange={(e) => setConfig({ ...config, orgCode: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-steel hover:bg-brand-steel-light text-slate-900 text-xs font-black flex items-center gap-2 shadow-lg shadow-brand-steel/20"
            >
              <Save className="w-4 h-4 stroke-[2.5]" /> Save Configuration
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
