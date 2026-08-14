import React, { useState } from 'react';
import { User, Building, Mail, Phone, Lock, LogIn, UserPlus, Shield, CheckCircle2, FileText, Clock, AlertCircle, Factory } from 'lucide-react';
import { registerCustomer, loginCustomer } from '../services/headlessApi';

export default function CustomerPortal({ customerUser, setCustomerUser }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      let res;
      if (isRegisterMode) {
        res = await registerCustomer(formData);
      } else {
        res = await loginCustomer({ email: formData.email, password: formData.password });
      }

      const payloadData = res.data?.data || res.data || res;
      const customerObj = payloadData?.customer;
      const token = payloadData?.token;

      if (customerObj) {
        localStorage.setItem('urbanspan_customer_token', token || '');
        localStorage.setItem('urbanspan_customer_user', JSON.stringify(customerObj));
        setCustomerUser(customerObj);
      } else {
        setErrorMsg('Sign in failed: Invalid response format from server.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please check credentials or API settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('urbanspan_customer_token');
    localStorage.removeItem('urbanspan_customer_user');
    setCustomerUser(null);
  };

  if (customerUser) {
    return (
      <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white shadow-lg border border-slate-200 p-8 rounded-3xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-slate-900 text-2xl font-black shadow-lg shadow-brand-steel/20">
              {customerUser.name?.charAt(0) || 'U'}
            </div>
            <div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Urbanspan Client Account
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{customerUser.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{customerUser.company || 'Infrastructure Partner'} • {customerUser.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
          >
            Sign Out Portal
          </button>
        </div>

        {/* Portal Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-steel/40 transition-all p-6 rounded-2xl md:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-steel-light" /> Active Steel Supply Contracts & Orders
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Contract #US-2026-9910</div>
                  <div className="text-xs text-slate-500">Navi Mumbai Metro Line 4 — Fe-550D TMT Supply (1,500 MT)</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-steel/20 text-blue-300 text-xs font-semibold border border-brand-steel/30">
                  In Dispatch
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Proforma Quote #PQ-8812</div>
                  <div className="text-xs text-slate-500">ISMB Heavy Beams (300 MT) for Factory Expansion</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  Quote Approved
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-steel/40 transition-all p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-steel-light" /> Assigned Key Account Manager
            </h3>
            
            <div className="text-center p-4 rounded-xl bg-white/60 border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-white-light text-brand-steel-light font-black mx-auto mb-2 flex items-center justify-center">
                SS
              </div>
              <div className="font-bold text-slate-900 text-sm">Sunil Sharma</div>
              <div className="text-xs text-slate-500">Managing Director & Sales Lead</div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                Direct: ssharma@urbanspan.com
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-md mx-auto px-4">
      <div className="bg-white shadow-lg border border-slate-200 p-8 rounded-3xl border border-slate-200 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-steel/20">
            <Lock className="w-6 h-6 text-slate-900" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isRegisterMode ? 'Register Client Account' : 'Urbanspan Client Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegisterMode ? 'Create a client account for live chat & mill certificate tracking' : 'Access your steel supply contracts & proforma quotes'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rajesh Khurana"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Infrastructure Org</label>
                <input
                  type="text"
                  required
                  placeholder="Larsen & Infra Projects Ltd"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Business Email</label>
            <input
              type="email"
              required
              placeholder="rkhurana@larseninfra.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-steel"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-primary text-slate-900 font-extrabold text-sm shadow-lg shadow-brand-steel/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Authenticating...' : isRegisterMode ? 'Create Client Account' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
            }}
            className="text-xs text-brand-steel-light hover:text-blue-300 font-semibold"
          >
            {isRegisterMode ? 'Already have an account? Sign in' : "Don't have a client account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
