import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Phone, Lock, LogIn, UserPlus, Shield, CheckCircle2, FileText, Clock, AlertCircle, Factory, Truck, Scale, CheckCircle, RefreshCw, Download, Layers, Tag, ExternalLink, UserCheck } from 'lucide-react';
import { registerCustomer, loginCustomer, getCustomerOrders, getCustomerInquiries, getCustomerAccountTeam } from '../services/headlessApi';

const DISPATCH_STAGES = [
  { key: 'order_confirmed', label: '1. Order Booked', icon: FileText },
  { key: 'mill_fabrication', label: '2. Mill Rolling', icon: Factory },
  { key: 'weighbridge_loaded', label: '3. Weighbridge Loaded', icon: Scale },
  { key: 'in_transit', label: '4. In Transit', icon: Truck },
  { key: 'delivered', label: '5. Delivered', icon: CheckCircle }
];

const formatStageLabel = (stage) => {
  if (!stage) return 'Active Procurement';
  const clean = String(stage).toLowerCase().trim();
  const map = {
    order_received: 'Order Confirmed',
    order_confirmed: 'Order Booked',
    qualification: 'Order Received',
    proposal: 'Quotation Ready',
    negotiation: 'Under Negotiation',
    in_transit_billed: 'In Transit (Invoice Issued)',
    'in transit_billed': 'In Transit (Invoice Issued)',
    'in transit billed': 'In Transit (Invoice Issued)',
    freight_placed: 'Freight Placed',
    weighbridge_loaded: 'Weighbridge Loaded',
    mill_fabrication: 'Mill Rolling',
    in_transit: 'In Transit',
    delivered: 'Delivered & Reconciled',
    closed_won: 'Fulfilled & Closed',
    closed_lost: 'Cancelled'
  };
  return map[clean] || stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function CustomerPortal({ customerUser, setCustomerUser, appVersion, onCheckUpdate, isUpdating, otaStatus }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState('inquiries');
  const [orderFilterTab, setOrderFilterTab] = useState('active'); // 'active' | 'delivered'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [accountTeam, setAccountTeam] = useState(customerUser?.account_team || null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [accountTeamLoading, setAccountTeamLoading] = useState(false);

  const activeOrders = React.useMemo(() => {
    return (orders || []).filter(o => o.stage !== 'delivered' && o.stage !== 'closed_won' && o.dispatch_status !== 'delivered');
  }, [orders]);

  const deliveredOrders = React.useMemo(() => {
    return (orders || []).filter(o => o.stage === 'delivered' || o.stage === 'closed_won' || o.dispatch_status === 'delivered');
  }, [orders]);

  useEffect(() => {
    if (customerUser) {
      if (customerUser.account_team) {
        setAccountTeam(customerUser.account_team);
      }
      fetchAllData();
    }
  }, [customerUser]);

  const fetchAllData = async () => {
    fetchOrders();
    fetchInquiries();
    fetchAccountTeam();
  };

  const fetchAccountTeam = async () => {
    setAccountTeamLoading(true);
    try {
      const res = await getCustomerAccountTeam();
      if (res) {
        setAccountTeam(res);
      }
    } catch (err) {
      console.warn('Could not load dynamic account team', err);
    } finally {
      setAccountTeamLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await getCustomerOrders();
      setOrders(res?.data || []);
    } catch (err) {
      console.warn('Could not load live customer orders', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const res = await getCustomerInquiries();
      const items = res?.data || [];
      setInquiries(items);
      if (items.length === 0 && orders.length > 0) {
        setActivePortalTab('orders');
      }
    } catch (err) {
      console.warn('Could not load live customer inquiries', err);
    } finally {
      setInquiriesLoading(false);
    }
  };

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
      console.warn('Authentication rejected:', err.response?.data?.error || err.message);
      setErrorMsg(err.response?.data?.error || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('urbanspan_customer_token');
    localStorage.removeItem('urbanspan_customer_user');
    setCustomerUser(null);
    setOrders([]);
  };

  const isQuoteConfirmed = (inq) => {
    return inq.quote_status === 'approved' || inq.quote_status === 'confirmed' || inq.status === 'proposal' || inq.status === 'converted' || inq.status === 'won';
  };

  const downloadQuotationPDF = (inq) => {
    if (!isQuoteConfirmed(inq)) {
      alert('This quotation is currently under commercial review and has not yet been confirmed by our sales desk. The official PDF will be available for download once confirmed.');
      return;
    }

    const quoteData = inq.quote_data || {};
    const quoteRef = `US-Q-${inq.id.slice(0, 8).toUpperCase()}`;
    const clientName = customerUser?.name || inq.name || 'Valued Client';
    const companyName = customerUser?.company || inq.company || inq.party_name || '';
    const clientPhone = customerUser?.phone || inq.phone || '';
    const clientEmail = customerUser?.email || inq.email || '';
    
    const deliveryType = quoteData.delivery_type || quoteData.quote_type || 'for';
    const isFOR = deliveryType === 'for' || deliveryType === 'for_delivered';
    const deliveryDestination = quoteData.destination || quoteData.delivery_destination || inq.custom_data?.destination || inq.custom_data?.city || 'Indore Project Site';
    
    const items = Array.isArray(quoteData.items) && quoteData.items.length > 0
      ? quoteData.items
      : (inq.items || []);

    const materialSubtotal = Number(quoteData.material_subtotal || quoteData.base_subtotal || inq.expected_value || 0);
    const loadingAmount = Number(quoteData.loading_subtotal || quoteData.loading_total || 0);
    const loadingRate = Number(quoteData.loading_rate || 0);
    const loadingType = quoteData.loading_type || 'per_mt';
    const loadingDetails = loadingAmount > 0 ? (loadingType === 'per_mt' ? `₹${loadingRate}/MT` : 'Flat Consignment') : '';

    const freightAmount = isFOR ? Number(quoteData.freight_subtotal || quoteData.freight_total || 0) : 0;
    const freightRate = Number(quoteData.freight_rate || 0);
    const freightType = quoteData.freight_type || 'per_mt';
    const freightDetails = isFOR && freightAmount > 0 ? (freightType === 'per_mt' ? `₹${freightRate}/MT` : 'Flat Freight') : '';

    const taxableSubtotal = Number(quoteData.base_subtotal || (materialSubtotal + loadingAmount + freightAmount));
    const taxRate = 18;
    const taxAmount = Math.round(taxableSubtotal * (taxRate / 100));
    const grandTotal = Number(quoteData.grand_total || (taxableSubtotal + taxAmount));
    const quoteNotes = quoteData.quote_notes || quoteData.notes || inq.notes || '';
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download your quotation PDF');
      return;
    }

    const itemsHtml = items.map((item, idx) => {
      const qty = Number(item.quantity || item.qty || 1).toFixed(3);
      const rate = Number(item.quoted_rate || item.unit_price || item.benchmark_rate || item.base_price || 0);
      const itemSubtotal = Number(item.subtotal || (Number(qty) * rate));
      const itemGst = itemSubtotal * 0.18;
      const itemLineTotal = itemSubtotal + itemGst;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 8px; font-weight: bold; color: #1f2937;">${idx + 1}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: bold; color: #111827;">${item.product_name || item.name}</div>
            <div style="font-size: 11px; color: #6b7280;">IS 1786:2008 Fe-550D High Ductility Grade ${item.notes ? `• ${item.notes}` : ''}</div>
          </td>
          <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${qty} MT</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${rate.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 8px; text-align: right; color: #4b5563;">₹${Math.round(itemGst).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #1e40af;">₹${Math.round(itemLineTotal).toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Commercial Quotation - ${quoteRef}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 30px; background: #fff; }
            .quote-card { max-width: 880px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
            .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .items-table th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
            .totals-table { width: 380px; margin-left: auto; margin-bottom: 24px; border-collapse: collapse; font-size: 12px; }
            .totals-table td { padding: 5px 8px; }
            .badge-for { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; }
            .badge-ex { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; }
            .notes-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #854d0e; }
            .terms-box { border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 11px; color: #4b5563; }
            @media print {
              body { padding: 0; }
              .quote-card { border: none; box-shadow: none; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 880px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div class="quote-card">
            <table class="header-table">
              <tr>
                <td>
                  <div style="font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px;">UrbanSpan Infrastructure & Steel Pvt Ltd</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Primary Steel Distro · Raipur & Indore Hubs</div>
                  <div style="font-size: 11px; color: #4b5563; font-weight: 600; margin-top: 2px;">GSTIN: 22AAAAA0000A1Z5</div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 18px; font-weight: 800; color: #2563eb;">COMMERCIAL QUOTATION</div>
                  <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">Ref: <span style="font-family: monospace;">${quoteRef}</span></div>
                  <div style="font-size: 12px; color: #6b7280;">Date: ${todayStr}</div>
                </td>
              </tr>
            </table>

            <div class="client-grid">
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 4px;">Billed & Supplied To</div>
                <div style="font-size: 15px; font-weight: bold; color: #0f172a;">${clientName}</div>
                ${companyName ? `<div style="font-size: 13px; font-weight: 600; color: #334155;">${companyName}</div>` : ''}
                ${clientPhone ? `<div style="font-size: 12px; color: #475569;">Phone: ${clientPhone}</div>` : ''}
                ${clientEmail ? `<div style="font-size: 12px; color: #475569;">Email: ${clientEmail}</div>` : ''}
              </div>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 4px;">Commercial Delivery Terms</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e40af;">
                  ${isFOR ? 'F.O.R. Delivered Destination' : 'Ex-Plant / Ex-Mill Gate'}
                  <span class="${isFOR ? 'badge-for' : 'badge-ex'}">${isFOR ? 'F.O.R.' : 'EXW'}</span>
                </div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                  Destination: <strong>${deliveryDestination || (isFOR ? 'Indore Project Site' : 'Ex-Raipur Mill')}</strong>
                </div>
                <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 2px;">Rate Validity: 24 Hours Spot Rate</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Item & Grade Description</th>
                  <th style="text-align: center; width: 85px;">Quantity</th>
                  <th style="text-align: right; width: 110px;">Quoted Rate</th>
                  <th style="text-align: right; width: 110px;">Base Amount</th>
                  <th style="text-align: right; width: 90px;">18% GST</th>
                  <th style="text-align: right; width: 120px;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td style="color: #64748b;">Material Basic Subtotal:</td>
                <td style="text-align: right; font-weight: bold;">₹${Math.round(materialSubtotal).toLocaleString('en-IN')}</td>
              </tr>
              ${loadingAmount > 0 ? `
              <tr>
                <td style="color: #64748b;">Loading & Handling Charges ${loadingDetails ? `(${loadingDetails})` : ''}:</td>
                <td style="text-align: right; font-weight: 600; color: #0284c7;">+₹${Math.round(loadingAmount).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              ${isFOR && freightAmount > 0 ? `
              <tr>
                <td style="color: #64748b;">Freight / Transport Charges ${freightDetails ? `(${freightDetails})` : ''}:</td>
                <td style="text-align: right; font-weight: 600; color: #0284c7;">+₹${Math.round(freightAmount).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="color: #334155; font-weight: bold;">Total Taxable Base Value:</td>
                <td style="text-align: right; font-weight: bold; color: #0f172a;">₹${Math.round(taxableSubtotal).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">CGST (9.0%):</td>
                <td style="text-align: right; font-weight: 600;">₹${Math.round(taxAmount / 2).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">SGST (9.0%):</td>
                <td style="text-align: right; font-weight: 600;">₹${Math.round(taxAmount / 2).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
                <td style="font-size: 14px; font-weight: 900; color: #1e3a8a; padding: 8px 8px;">Consignment Grand Total:</td>
                <td style="font-size: 16px; font-weight: 900; color: #1e3a8a; text-align: right; padding: 8px 8px;">₹${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            ${quoteNotes && quoteNotes.trim() ? `
            <div class="notes-box">
              <div style="font-weight: bold; margin-bottom: 4px;">📌 Special Quotation Notes & Instructions:</div>
              <div>${quoteNotes.replace(/\n/g, '<br/>')}</div>
            </div>
            ` : ''}

            <div class="terms-box">
              <div style="font-weight: bold; margin-bottom: 6px; color: #111827;">Standard Commercial Terms & Conditions:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <div>• <strong>Payment Terms:</strong> 100% RTGS Advance against Proforma Invoice</div>
                  <div>• <strong>Supply Terms:</strong> ${isFOR ? 'F.O.R. Destination Delivered' : 'Ex-Mill Raipur Gate'}</div>
                  <div>• <strong>Tolerance:</strong> Standard IS 1786 rolling tolerance ±0.5%</div>
                </div>
                <div>
                  <div>• <strong>Bank:</strong> HDFC Bank Ltd (A/C: 50200012345678)</div>
                  <div>• <strong>IFSC:</strong> HDFC0001234 (Main Branch)</div>
                  <div>• <strong>MTC:</strong> Original Mill Test Certificate provided upon loading.</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (customerUser) {
    return (
      <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white shadow-lg border border-slate-200 p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200">
              {customerUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {customerUser.is_verified || (customerUser.status === 'active' && (customerUser.gstin || customerUser.gst_number)) ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Client Account
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> Client Portal Account
                  </span>
                )}
                {(customerUser.gstin || customerUser.gst_number) && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    GSTIN: {customerUser.gstin || customerUser.gst_number}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">{customerUser.name}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {customerUser.company ? `${customerUser.company} • ` : ''}{customerUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Refresh Orders & Inquiries"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading || inquiriesLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Portal Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl md:col-span-2">
            {/* Segmented Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-6">
              <button
                onClick={() => setActivePortalTab('inquiries')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'inquiries'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>My Quotes ({inquiries.length})</span>
              </button>

              <button
                onClick={() => { setActivePortalTab('orders'); setOrderFilterTab('active'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'orders' && orderFilterTab === 'active'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Active In-Flight ({activeOrders.length})</span>
              </button>

              <button
                onClick={() => { setActivePortalTab('orders'); setOrderFilterTab('delivered'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'orders' && orderFilterTab === 'delivered'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Delivered History ({deliveredOrders.length})</span>
              </button>
            </div>

            {/* TAB 1: INQUIRIES & SPOT QUOTES */}
            {activePortalTab === 'inquiries' && (
              <div>
                {inquiriesLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading commercial inquiries...</div>
                ) : inquiries.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">No submitted inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">Submit an RFQ from our product catalog to request live mill quotations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => {
                      const status = inq.status || 'new';
                      const statusMap = {
                        new: { label: 'Received / Under Review', color: 'bg-blue-100 text-blue-800' },
                        contacted: { label: 'Sales Desk Assigned', color: 'bg-amber-100 text-amber-800' },
                        qualified: { label: 'Commercial Evaluation', color: 'bg-indigo-100 text-indigo-800' },
                        proposal: { label: 'Official Quote Ready', color: 'bg-purple-100 text-purple-800' },
                        negotiation: { label: 'Rate Finalisation', color: 'bg-pink-100 text-pink-800' },
                        converted: { label: 'Contract Booked & Active', color: 'bg-emerald-100 text-emerald-800' },
                        won: { label: 'Contract Approved', color: 'bg-emerald-100 text-emerald-800' },
                        lost: { label: 'Closed', color: 'bg-slate-100 text-slate-700' }
                      };
                      const statusInfo = statusMap[status] || { label: status.toUpperCase(), color: 'bg-slate-100 text-slate-700' };

                      const inquiryTitle = inq.items?.[0]?.product_name 
                        ? `${inq.items[0].product_name}${inq.items.length > 1 ? ` (+${inq.items.length - 1} items)` : ''} RFQ`
                        : inq.name || inq.title || 'Steel Procurement RFQ';

                      const quoteData = inq.quote_data || {};
                      const isQuoteApproved = inq.quote_status === 'approved' || inq.quote_status === 'confirmed' || inq.status === 'proposal' || inq.status === 'converted' || inq.status === 'won';
                      const isQuotePendingApproval = inq.quote_status === 'pending_approval';
                      const hasConfirmedQuote = isQuoteApproved && quoteData && (quoteData.items || quoteData.base_subtotal || quoteData.grand_total);
                      const isFOR = quoteData.delivery_type === 'for' || quoteData.quote_type === 'for' || quoteData.delivery_type === 'for_delivered';
                      const destination = quoteData.destination || quoteData.delivery_destination || inq.custom_data?.destination || inq.custom_data?.city || '';

                      return (
                        <div key={inq.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-base font-bold text-slate-900">{inquiryTitle}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Submitted on {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {inq.assigned_rep_name && (
                                  <span> • Assigned Sales Lead: <b className="text-slate-700">{inq.assigned_rep_name}</b></span>
                                )}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* 1. Official Confirmed Commercial Quotation (Available AFTER backend confirmation) */}
                          {hasConfirmedQuote ? (
                            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                                    📑 Official Commercial Quotation
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isFOR ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                    {isFOR ? `🚚 F.O.R. Delivered Site${destination ? ` (${destination})` : ''}` : '🏭 Ex-Plant / Ex-Mill Raipur'}
                                  </span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Confirmed & Authorized
                                </span>
                              </div>

                              {/* Line items table */}
                              {Array.isArray(quoteData.items) && quoteData.items.length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <th className="py-2 px-2 font-semibold">Product</th>
                                        <th className="py-2 px-2 font-semibold text-center">Tonnage</th>
                                        <th className="py-2 px-2 font-semibold text-right">Quoted Rate</th>
                                        <th className="py-2 px-2 font-semibold text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {quoteData.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="py-2 px-2 font-bold text-slate-800">
                                            {item.product_name || item.name}
                                            {item.notes && <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>}
                                          </td>
                                          <td className="py-2 px-2 text-center font-semibold text-slate-700">
                                            {item.quantity || item.qty} {item.unit || 'MT'}
                                          </td>
                                          <td className="py-2 px-2 text-right font-semibold text-slate-800">
                                            ₹{Number(item.quoted_rate || item.base_price || 0).toLocaleString('en-IN')}/{item.unit || 'MT'}
                                          </td>
                                          <td className="py-2 px-2 text-right font-bold text-slate-900">
                                            ₹{Math.round(Number(item.subtotal || ((item.quantity || 1) * (item.quoted_rate || 0)))).toLocaleString('en-IN')}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Financial totals breakdown */}
                              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs">
                                <div className="space-y-1 text-slate-500">
                                  {Number(quoteData.material_subtotal || 0) > 0 && (
                                    <div>Material Basic Subtotal: <strong className="text-slate-800">₹{Math.round(Number(quoteData.material_subtotal)).toLocaleString('en-IN')}</strong></div>
                                  )}
                                  {Number(quoteData.loading_subtotal || 0) > 0 && (
                                    <div>Loading & Handling Charges: <strong className="text-sky-700">+₹{Math.round(Number(quoteData.loading_subtotal)).toLocaleString('en-IN')}</strong></div>
                                  )}
                                  {isFOR && Number(quoteData.freight_subtotal || 0) > 0 && (
                                    <div>Freight & Logistics Charges: <strong className="text-blue-700">+₹{Math.round(Number(quoteData.freight_subtotal)).toLocaleString('en-IN')}</strong></div>
                                  )}
                                  <div>Applicable 18% GST: <strong className="text-emerald-700">+₹{Math.round(Number(quoteData.total_gst || (quoteData.base_subtotal * 0.18) || 0)).toLocaleString('en-IN')}</strong></div>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Quoted Value (incl. GST)</span>
                                  <span className="text-lg font-black text-indigo-700">
                                    ₹{Math.round(Number(quoteData.grand_total || quoteData.base_subtotal * 1.18 || inq.expected_value || 0)).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* Quotation Notes */}
                              {(quoteData.quote_notes || quoteData.notes) && (
                                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                                  <span className="font-bold">📌 Special Terms & Notes:</span> {quoteData.quote_notes || quoteData.notes}
                                </div>
                              )}

                              {/* Download PDF Button (Confirmed Only) */}
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => downloadQuotationPDF(inq)}
                                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Official Quote PDF</span>
                                </button>
                              </div>
                            </div>
                          ) : isQuotePendingApproval ? (
                            /* 2. Special Rate Discount Approval Pending */
                            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/60">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                    ⏳ Rate Authorization in Progress
                                  </span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                                  Managerial Review Pending
                                </span>
                              </div>
                              <p className="text-amber-800 leading-relaxed">
                                Our commercial team has formulated your quotation with special negotiated rate considerations. It is currently under final authorization by our Commercial Desk. Your official confirmed quotation and downloadable PDF will be unlocked immediately upon approval.
                              </p>
                              {inq.items && inq.items.length > 0 && (
                                <div className="bg-white/80 p-3 rounded-lg border border-amber-200/60 space-y-1 text-slate-700">
                                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Requested Material Specifications:</div>
                                  {inq.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-slate-800 font-medium">
                                      <span>• {item.product_name || item.name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                      <span className="font-bold">{item.quantity || item.custom_specifications?.requested_quantity || 1} {item.product_unit || item.unit || 'MT'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* 3. Inquiry Received & Pricing Desk Review (Unconfirmed) */
                            <div className="space-y-3">
                              {inq.items && inq.items.length > 0 && (
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                                  <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Requested Material Specifications:</div>
                                  {inq.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-slate-700 font-medium border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                      <span>• {item.product_name || item.name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                      <span className="font-bold text-slate-900">
                                        {item.quantity || item.custom_specifications?.requested_quantity || 1} {item.product_unit || item.unit || 'MT'}
                                        {item.base_price ? ` @ ₹${Number(item.base_price).toLocaleString('en-IN')}/${item.product_unit || 'MT'}` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
                                <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-bold text-blue-950">Pricing Desk Review in Progress</div>
                                  <div className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                                    Our commercial desk is verifying mill rolling schedules, freight logistics, and spot rates for your requirement. Your official confirmed quote and downloadable PDF will be made available here once confirmed by our sales desk.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {inq.notes && !hasConfirmedQuote && (
                            <div className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-200/60">
                              <span className="font-semibold text-slate-700">Inquiry Notes:</span> {inq.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs flex-wrap gap-2">
                            <div className="text-slate-600">
                              Estimated Consignment Value: <span className="font-black text-indigo-700 text-sm">₹{Number(inq.expected_value || 0).toLocaleString('en-IN')}</span>
                            </div>
                            {inq.assigned_rep_phone ? (
                              <a
                                href={`tel:${inq.assigned_rep_phone}`}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Sales Lead ({inq.assigned_rep_phone})
                              </a>
                            ) : accountTeam?.account_manager?.phone ? (
                              <a
                                href={`tel:${accountTeam.account_manager.phone}`}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Sales Desk ({accountTeam.account_manager.phone})
                              </a>
                            ) : (
                              <a
                                href="tel:+919425922225"
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Sales Desk (+91 94259 22225)
                              </a>
                            )}
                          </div>

                          {/* 1-Click Transition to Active Contract */}
                          {(status === 'converted' || status === 'won') && (
                            <button
                              onClick={() => setActivePortalTab('orders')}
                              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Truck className="w-4 h-4" />
                              <span>View Active Supply Contract & Live Dispatch Tracker ➔</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ACTIVE & DELIVERED SUPPLY CONTRACTS */}
            {activePortalTab === 'orders' && (
              <div>
                {ordersLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading order tracker...</div>
                ) : (orderFilterTab === 'active' ? activeOrders : deliveredOrders).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">
                      {orderFilterTab === 'active' ? 'No active in-flight contracts right now' : 'No past delivered contracts recorded yet'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {orderFilterTab === 'active' 
                        ? (deliveredOrders.length > 0 ? `You have ${deliveredOrders.length} fulfilled order(s) in your delivery history.` : 'Submit an RFQ or contact your sales desk to start a new steel consignment.')
                        : 'Completed consignments and reconciled tax invoices will appear here once delivered.'}
                    </p>
                    {orderFilterTab === 'active' && deliveredOrders.length > 0 && (
                      <button
                        onClick={() => setOrderFilterTab('delivered')}
                        className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>View Fulfilled Delivery History ({deliveredOrders.length}) ➔</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(orderFilterTab === 'active' ? activeOrders : deliveredOrders).map((order) => {
                      const currentStatus = order.dispatch_status || 'order_confirmed';
                      const stageKeys = DISPATCH_STAGES.map(s => s.key);
                      const currentIdx = Math.max(0, stageKeys.indexOf(currentStatus));

                      // 1. Calculate contracted tonnage from line items or custom data
                      const contractedTonnage = (order.items && order.items.length > 0)
                        ? order.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0)
                        : Number(order.custom_data?.total_tonnage || order.custom_data?.quote_data?.total_tonnage || order.custom_data?.tonnage || order.custom_data?.quantity || order.quantity_mt || 0);

                      // 2. Extract live fleet dispatches (syncing both split fleet array and single-truck dispatch_details)
                      let fleetDispatches = order.custom_data?.sub_entities?.fleet_dispatches || order.custom_data?.fleet_dispatches || [];
                      const dd = order.dispatch_details || {};
                      if (fleetDispatches.length === 0 && (dd.truck_number || dd.tonnage || dd.net_weight)) {
                        fleetDispatches = [{
                          id: 'primary_dispatch',
                          truck_number: dd.truck_number || 'Primary Vehicle',
                          driver_name: dd.driver_name || 'Assigned Driver',
                          driver_phone: dd.driver_phone || '',
                          dispatched_quantity: Number(dd.net_weight || dd.tonnage || 0),
                          gross_weight: dd.gross_weight || null,
                          tare_weight: dd.tare_weight || null,
                          net_weight: Number(dd.net_weight || dd.tonnage || 0),
                          eway_bill_no: dd.eway_bill_no || '',
                          dispatch_date: dd.dispatch_date || (order.updated_at ? order.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
                          status: (dd.tracking_status === 'delivered' || order.stage === 'delivered') ? 'Delivered' : (dd.tracking_status === 'in_transit' || order.stage === 'in_transit_billed') ? 'In Transit' : 'Loaded'
                        }];
                      }

                      const totalDispatchedTonnage = fleetDispatches.reduce((sum, d) => sum + Number(d.dispatched_quantity || d.quantity || d.net_weight || 0), 0);

                      // 3. Calculate real progress based on actual weighed/dispatched tonnage
                      let currentPercent = 0;
                      let displayedDispatchedTonnage = totalDispatchedTonnage;

                      if (contractedTonnage > 0) {
                        if (totalDispatchedTonnage > 0) {
                          currentPercent = Math.min(100, Math.round((totalDispatchedTonnage / contractedTonnage) * 100));
                          displayedDispatchedTonnage = totalDispatchedTonnage;
                        } else if (currentStatus === 'delivered' || order.stage === 'delivered') {
                          currentPercent = 100;
                          displayedDispatchedTonnage = contractedTonnage;
                        } else {
                          currentPercent = 0;
                          displayedDispatchedTonnage = 0;
                        }
                      }

                      return (
                        <div key={order.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-base font-extrabold text-slate-900">{order.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Contract Value: <span className="font-bold text-indigo-700 text-sm">₹{Number(order.deal_value || 0).toLocaleString('en-IN')}</span> • Stage: <span className="font-semibold text-slate-700">{formatStageLabel(order.stage)}</span>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold shrink-0">
                              {formatStageLabel(currentStatus)}
                            </span>
                          </div>

                          {/* Line Manifest Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                              <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Itemized Line Manifest:</div>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-700 font-medium border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                  <span>• {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                  <span className="font-bold text-slate-900">{item.quantity} {item.product_unit || 'MT'} @ ₹{Number(item.unit_price).toLocaleString('en-IN')}/{item.product_unit || 'MT'}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Live Fleet & Multi-Trailer Consignment Manifest */}
                          {fleetDispatches.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                                  <Truck className="w-4 h-4 text-blue-600" />
                                  <span>Live Consignment & Fleet Dispatch Manifest ({fleetDispatches.length} Trailer{fleetDispatches.length > 1 ? 's' : ''})</span>
                                </div>
                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                  Dispatched: {totalDispatchedTonnage.toFixed(3)} MT / {contractedTonnage} MT ({currentPercent}%)
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                      <th className="pb-2">Truck / Vehicle</th>
                                      <th className="pb-2">Driver & Contact</th>
                                      <th className="pb-2">Weighbridge Scale</th>
                                      <th className="pb-2">e-Way Bill</th>
                                      <th className="pb-2">Dispatch Date</th>
                                      <th className="pb-2 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {fleetDispatches.map((tr, tIdx) => (
                                      <tr key={tr.id || tIdx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                          <span>{tr.truck_number || 'Trailer'}</span>
                                        </td>
                                        <td className="py-2.5">
                                          <div className="font-semibold text-slate-800">{tr.driver_name || 'Assigned Driver'}</div>
                                          {tr.driver_phone && (
                                            <a href={`tel:${tr.driver_phone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                                              <Phone className="w-3 h-3" /> {tr.driver_phone}
                                            </a>
                                          )}
                                        </td>
                                        <td className="py-2.5">
                                          <div className="font-bold text-indigo-700">{Number(tr.dispatched_quantity || tr.net_weight || 0).toFixed(3)} MT</div>
                                          {(tr.gross_weight || tr.tare_weight) && (
                                            <div className="text-[10px] text-slate-400">
                                              Gross: {tr.gross_weight}T | Tare: {tr.tare_weight}T
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2.5 font-mono text-[11px] text-slate-600">
                                          {tr.eway_bill_no ? `EWB-${tr.eway_bill_no}` : '—'}
                                        </td>
                                        <td className="py-2.5 text-[11px] text-slate-500">
                                          {tr.dispatch_date || '—'}
                                        </td>
                                        <td className="py-2.5 text-right">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            tr.status === 'Delivered'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : tr.status === 'In Transit'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {tr.status || 'Loaded'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Tonnage Progress Bar */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-indigo-600" /> Tonnage Progress Tracker
                              </span>
                              <span className="font-bold text-indigo-700">
                                {displayedDispatchedTonnage.toFixed ? Number(displayedDispatchedTonnage).toFixed(3) : displayedDispatchedTonnage} / {contractedTonnage} MT ({currentPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  currentPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${currentPercent}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>0 MT (Booked)</span>
                              <span>{Math.round(contractedTonnage * 0.5)} MT (Mill Rolling)</span>
                              <span>{contractedTonnage} MT (Delivered)</span>
                            </div>
                          </div>

                          {/* 5-Tier Dispatch Progress Tracker */}
                          <div className="pt-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                              5-Tier Dispatch Progress Tracker
                            </div>
                            <div className="relative">
                              <div className="grid grid-cols-5 gap-1.5 text-center relative z-10">
                                {DISPATCH_STAGES.map((st, idx) => {
                                  const isDone = currentIdx > idx;
                                  const isCurrent = currentIdx === idx;
                                  const Icon = st.icon;

                                  return (
                                    <div key={st.key} className="flex flex-col items-center">
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs mb-1.5 transition-all ${
                                        isCurrent
                                          ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-200 font-bold scale-105'
                                          : isDone
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-slate-200 text-slate-400'
                                      }`}>
                                        {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                      </div>
                                      <span className={`text-[10px] font-semibold leading-tight ${
                                        isCurrent
                                          ? 'text-indigo-700 font-bold'
                                          : isDone
                                          ? 'text-emerald-700'
                                          : 'text-slate-400'
                                      }`}>
                                        {st.label}
                                      </span>
                                      <span className="text-[9px] text-slate-400 mt-0.5">
                                        {isDone ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
                  <Shield className="w-5 h-5 text-indigo-600" /> Key Account Team
                </h3>
                {accountTeam?.is_assigned ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Dedicated
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Commercial Desk
                  </span>
                )}
              </div>
              
              {accountTeamLoading ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading account team...
                </div>
              ) : (
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black mx-auto mb-2.5 flex items-center justify-center text-base shadow-sm">
                    {accountTeam?.account_manager?.name
                      ? accountTeam.account_manager.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'SD'}
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {accountTeam?.account_manager?.name || 'Commercial Sales Desk'}
                  </div>
                  <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                    {accountTeam?.account_manager?.designation || 'Key Accounts Desk'}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                    <a
                      href={`mailto:${accountTeam?.account_manager?.email || 'support@urbanspaninfra.co.in'}`}
                      className="flex items-center justify-center gap-1.5 text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{accountTeam?.account_manager?.email || 'support@urbanspaninfra.co.in'}</span>
                    </a>
                    {(accountTeam?.account_manager?.phone || '+91 94259 22225') && (
                      <a
                        href={`tel:${accountTeam?.account_manager?.phone || '+919425922225'}`}
                        className="flex items-center justify-center gap-1.5 text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{accountTeam?.account_manager?.phone || '+91 94259 22225'}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" /> Operations & Dispatch Contact
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  {accountTeam?.operations_coordinator?.name || 'Logistics & Dispatch Desk'}
                  <span className="text-slate-500 font-normal ml-1">
                    ({accountTeam?.operations_coordinator?.designation || 'Operations Coordinator'})
                  </span>
                </div>
                {accountTeam?.operations_coordinator?.email ? (
                  <div className="text-slate-500 text-[11px]">
                    <a href={`mailto:${accountTeam.operations_coordinator.email}`} className="hover:underline text-blue-600">
                      {accountTeam.operations_coordinator.email}
                    </a>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px]">
                    <a href="mailto:support@urbanspaninfra.co.in" className="hover:underline text-blue-600">
                      support@urbanspaninfra.co.in
                    </a>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 mb-0">
                  For dispatch schedule changes, weighbridge slips, and mill test certificates (MTC).
                </p>
              </div>
            </div>

            {/* App Version & OTA System Info */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-900">Urbanspan App {appVersion || 'v1.2.0'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  Live OTA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Current build is connected to the live GCP cloud engine with automatic OTA synchronisation.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onCheckUpdate}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-brand-steel' : 'text-slate-600'}`} />
                  <span>{isUpdating ? 'Checking...' : 'Check OTA'}</span>
                </button>
                <a
                  href="https://storage.googleapis.com/urbanspan-downloads/urbanspan-app-v3.apk"
                  download
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK</span>
                </a>
              </div>
              {otaStatus && (
                <p className="text-[11px] text-indigo-600 font-semibold mt-2 text-center">
                  {otaStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-md mx-auto px-4">
      <div className="bg-white shadow-lg border border-slate-200 p-8 rounded-3xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isRegisterMode ? 'Register Client Account' : 'Urbanspan Client Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegisterMode ? 'Create a client account for live order tracking & mill test certificates' : 'Access your steel supply contracts & live delivery milestones'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-6 flex items-center gap-2">
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
                  placeholder="Amit Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Infrastructure Org</label>
                <input
                  type="text"
                  required
                  placeholder="Metro Infra Projects Ltd"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Business Email</label>
            <input
              type="email"
              required
              placeholder="amit.buyer@metroinfra.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
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
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-4 transition-colors"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            {isRegisterMode ? 'Already have an account? Sign in' : "Don't have a client account? Register"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="font-semibold text-slate-600">Urbanspan {appVersion || 'v1.2.0'}</span>
          <button 
            type="button" 
            onClick={onCheckUpdate} 
            disabled={isUpdating}
            className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Checking...' : 'Check Updates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

