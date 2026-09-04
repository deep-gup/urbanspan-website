import React, { useState, useEffect } from 'react';
import { 
  User, Building, Mail, Phone, Lock, LogIn, UserPlus, Shield, 
  CheckCircle2, FileText, Clock, AlertCircle, Factory, Truck, 
  Scale, CheckCircle, RefreshCw, Download, Layers, Tag, 
  ExternalLink, UserCheck, X, Printer, Share2, Copy, Check, 
  ArrowLeft, Eye, EyeOff, Building2, MapPin, Sparkles, CheckSquare,
  ChevronDown
} from 'lucide-react';
import { registerCustomer, loginCustomer, getCustomerOrders, getCustomerInquiries, getCustomerAccountTeam, confirmCustomerDelivery } from '../services/headlessApi';

const CLIENT_CATEGORIES = [
  { id: 'Builder', label: 'Builder / Real Estate Developer', desc: 'High-Rise, Commercial & Residential Townships', icon: Building2 },
  { id: 'Contractor', label: 'Infrastructure / Civil EPC Contractor', desc: 'Roads, Bridges, Metro, Flyovers & Govt PWD/CPWD', icon: Truck },
  { id: 'Industrial / Fabricator', label: 'Industrial / PEB Fabricator', desc: 'Pre-Engineered Buildings, Sheds & Steel Structures', icon: Factory },
  { id: 'Trader', label: 'Steel Trader / Stockist / Wholesale', desc: 'Secondary Distribution & Rebar Wholesale Trading', icon: Layers },
  { id: 'Retailer', label: 'Retailer / Building Material Store', desc: 'Retail Hardware Counter & Building Material Shop', icon: Tag },
  { id: 'Consumer', label: 'Individual House Builder (IHB)', desc: 'Personal Home Construction & Private Residential Plots', icon: User },
  { id: 'Other', label: 'Other Category / Specialized', desc: 'Other commercial, institutional or specialized operations', icon: Sparkles }
];

const REGIONAL_HUBS = ['Indore', 'Pithampur', 'Bhopal', 'Ujjain', 'Dewas', 'Gwalior', 'Jabalpur', 'Ratlam', 'Sagar', 'Singrauli', 'Other City'];

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

const formatMatrixSummary = (matrix, unit = 'MT') => {
  if (!matrix || typeof matrix !== 'object') return null;
  const parts = [];
  const order = ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '28mm', '32mm'];
  order.forEach(k => {
    const v = parseFloat(matrix[k]);
    if (!isNaN(v) && v > 0) parts.push(`${k}: ${v} ${unit}`);
  });
  Object.keys(matrix).forEach(k => {
    if (!order.includes(k) && k !== 'customRows' && !k.startsWith('_')) {
      const v = parseFloat(matrix[k]);
      if (!isNaN(v) && v > 0) parts.push(`${k}: ${v} ${unit}`);
    }
  });
  if (Array.isArray(matrix.customRows)) {
    matrix.customRows.forEach(r => {
      const v = parseFloat(r?.qty);
      if (r?.section && !isNaN(v) && v > 0) parts.push(`${r.section}: ${v} ${unit}`);
    });
  }
  return parts.length > 0 ? parts.join(' · ') : null;
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
    phone: '',
    gstin: '',
    category: '',
    city: 'Indore',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [accountTeam, setAccountTeam] = useState(customerUser?.account_team || null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [accountTeamLoading, setAccountTeamLoading] = useState(false);

  // In-App Quotation Viewer Modal State
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState(null);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // In-Website Delivery Confirmation Modal State
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({
    isOpen: false,
    orderId: null,
    consignmentId: null,
    truckNumber: '',
    netWeight: null,
    invoiceNo: '',
    isSubmitting: false,
    error: null
  });
  const [toastNotification, setToastNotification] = useState(null);

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
      setInquiries(res?.data || []);
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
      if (isRegisterMode) {
        const res = await registerCustomer(formData);
        if (res?.success) {
          localStorage.setItem('urbanspan_customer_token', res.data.token);
          localStorage.setItem('urbanspan_customer_user', JSON.stringify(res.data.customer));
          setCustomerUser(res.data.customer);
        } else {
          setErrorMsg(res?.error || res?.message || 'Registration could not be completed. Please check your details.');
        }
      } else {
        const res = await loginCustomer({ email: formData.email, password: formData.password });
        if (res?.success) {
          localStorage.setItem('urbanspan_customer_token', res.data.token);
          localStorage.setItem('urbanspan_customer_user', JSON.stringify(res.data.customer));
          setCustomerUser(res.data.customer);
        } else {
          setErrorMsg(res?.error || res?.message || 'Invalid email or password. Please verify your credentials.');
        }
      }
    } catch (err) {
      console.warn('Portal Auth Error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (serverMsg) {
        setErrorMsg(serverMsg);
      } else if (err.response?.status === 400) {
        setErrorMsg('Please ensure all required fields (Name, Company, Phone, Email, Password) are filled correctly.');
      } else if (err.response?.status === 401) {
        setErrorMsg('Invalid email or password. Please try again.');
      } else if (err.response?.status === 409 || err.message?.includes('already registered')) {
        setErrorMsg('This email address is already registered. Please sign in with your password.');
      } else if (err.response?.status === 500) {
        setErrorMsg('We are experiencing a temporary server delay. Please try again in a few moments.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setErrorMsg('Network connection timed out. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('urbanspan_customer_token');
    localStorage.removeItem('urbanspan_customer_user');
    setCustomerUser(null);
    setOrders([]);
    setSelectedQuoteForPreview(null);
  };

  const isQuoteConfirmed = (inq) => {
    if (!inq) return false;
    // Strict Conscious Staff Gate: Managerial approval ('approved') alone does NOT unlock the quote to the client.
    // The sales representative handling the account must explicitly review & confirm ('confirmed' / 'dispatched').
    if (inq.quote_status === 'pending_approval' || inq.quote_status === 'approved' || inq.quote_status === 'rejected') {
      return false;
    }
    return inq.quote_status === 'confirmed' || inq.quote_status === 'dispatched' || inq.status === 'converted' || inq.status === 'won';
  };

  // Open In-App Quotation Viewer Modal
  const openQuotePreviewModal = (inq) => {
    if (!isQuoteConfirmed(inq)) {
      if (inq.quote_status === 'approved') {
        alert('This quotation has received pricing authorization from management and is currently undergoing final contract verification by your dedicated account manager. The official PDF and proforma contract will be unlocked as soon as released.');
      } else {
        alert('This quotation is currently under commercial review and has not yet been confirmed by our sales desk. The official PDF and full breakdown will be available once confirmed.');
      }
      return;
    }
    setSelectedQuoteForPreview(inq);
  };

  // Helper to generate Quotation HTML for printing
  const generateQuotationHtml = (inq) => {
    const quoteData = inq.quote_data || {};
    const template = quoteData.template || {};
    const companyNameHeader = template.company_name || 'UrbanSpan Infrastructure Pvt Ltd';
    const companyTagline = template.company_tagline || 'Primary Steel Distribution · Raipur & Indore Industrial Hubs';
    const companyGstin = template.gstin || '23AADCU4530F1ZQ';
    const companyPan = template.pan_number || 'AADCU4530F';
    const bankName = template.bank_name || 'Axis Bank Ltd';
    const bankAccountNo = template.bank_account_no || '10209376111';
    const bankIfsc = template.bank_ifsc || 'IDFB0041264';
    const bankBranch = template.bank_branch || 'Indore Branch';

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

    const itemsHtml = items.map((item, idx) => {
      const qty = Number(item.quantity || item.qty || 1).toFixed(3);
      const unit = item.unit || 'MT';
      const rate = Number(item.quoted_rate || item.unit_price || item.benchmark_rate || item.base_price || 0);
      const itemSubtotal = Number(item.subtotal || (Number(qty) * rate));
      const itemGst = itemSubtotal * 0.18;
      const itemLineTotal = itemSubtotal + itemGst;
      const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, unit);

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 8px; font-weight: bold; color: #1f2937;">${idx + 1}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: bold; color: #111827;">${item.product_name || item.name}</div>
            <div style="font-size: 11px; color: #6b7280;">IS 1786:2008 Fe-550D High Ductility Grade ${item.notes ? `• ${item.notes}` : ''}</div>
            ${matSummary ? `<div style="margin-top: 4px; font-size: 10px; color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 2px 6px; display: inline-block;"><strong>📐 Section Matrix:</strong> ${matSummary}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${qty} ${unit}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${rate.toLocaleString('en-IN')}/${unit}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 8px; text-align: right; color: #4b5563;">₹${Math.round(itemGst).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #1e40af;">₹${Math.round(itemLineTotal).toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Commercial Quotation - ${quoteRef}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #fff; }
            .quote-card { max-width: 880px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header-table { width: 100%; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
            .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .items-table th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
            .totals-table { width: 380px; margin-left: auto; margin-bottom: 20px; border-collapse: collapse; font-size: 12px; }
            .totals-table td { padding: 5px 8px; }
            .badge-for { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; }
            .badge-ex { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; }
            .notes-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #854d0e; }
            .terms-box { border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #4b5563; }
            @media print {
              body { padding: 0; }
              .quote-card { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="quote-card">
            <table class="header-table">
              <tr>
                <td>
                  <div style="font-size: 20px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px;">${companyNameHeader}</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${companyTagline}</div>
                  <div style="font-size: 11px; color: #4b5563; font-weight: 600; margin-top: 2px;">GSTIN: ${companyGstin}${companyPan ? ` | PAN: ${companyPan}` : ''}</div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 16px; font-weight: 800; color: #2563eb;">COMMERCIAL QUOTATION</div>
                  <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">Ref: <span style="font-family: monospace;">${quoteRef}</span></div>
                  <div style="font-size: 11px; color: #6b7280;">Date: ${todayStr}</div>
                </td>
              </tr>
            </table>

            <div class="client-grid">
              <div>
                <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px;">Billed & Supplied To</div>
                <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${clientName}</div>
                ${companyName ? `<div style="font-size: 12px; font-weight: 600; color: #334155;">${companyName}</div>` : ''}
                ${clientPhone ? `<div style="font-size: 11px; color: #475569;">Phone: ${clientPhone}</div>` : ''}
                ${clientEmail ? `<div style="font-size: 11px; color: #475569;">Email: ${clientEmail}</div>` : ''}
              </div>
              <div>
                <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px;">Commercial Delivery Terms</div>
                <div style="font-size: 13px; font-weight: bold; color: #1e40af;">
                  ${isFOR ? 'F.O.R. Delivered Destination' : 'Ex-Plant / Ex-Mill Gate'}
                  <span class="${isFOR ? 'badge-for' : 'badge-ex'}">${isFOR ? 'F.O.R.' : 'EXW'}</span>
                </div>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                  Destination: <strong>${deliveryDestination || (isFOR ? 'Indore Project Site' : 'Ex-Raipur Mill')}</strong>
                </div>
                <div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 2px;">Rate Validity: 24 Hours Spot Rate</div>
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
                <td style="font-size: 13px; font-weight: 900; color: #1e3a8a; padding: 6px 8px;">Consignment Grand Total:</td>
                <td style="font-size: 15px; font-weight: 900; color: #1e3a8a; text-align: right; padding: 6px 8px;">₹${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            ${quoteNotes && quoteNotes.trim() ? `
            <div class="notes-box">
              <div style="font-weight: bold; margin-bottom: 4px;">📌 Special Quotation Notes & Instructions:</div>
              <div>${quoteNotes.replace(/\n/g, '<br/>')}</div>
            </div>
            ` : ''}

            <div class="terms-box">
              <div style="font-weight: bold; margin-bottom: 4px; color: #111827;">Standard Commercial Terms & Conditions:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <div>• <strong>Payment Terms:</strong> 100% RTGS Advance against Proforma Invoice</div>
                  <div>• <strong>Supply Terms:</strong> ${isFOR ? 'F.O.R. Destination Delivered' : 'Ex-Mill Raipur Gate'}</div>
                  <div>• <strong>Tolerance:</strong> Standard IS 1786 rolling tolerance ±0.5%</div>
                </div>
                <div>
                  <div>• <strong>Bank:</strong> ${bankName} (A/C: ${bankAccountNo})</div>
                  <div>• <strong>IFSC:</strong> ${bankIfsc} (${bankBranch})</div>
                  <div>• <strong>MTC:</strong> Original Mill Test Certificate provided upon loading.</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Safe In-App Printing Handler (Never destroys React app lifecycle or replaces window)
  const handlePrintQuotation = (inq) => {
    try {
      let iframe = document.getElementById('quotation-print-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'quotation-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      const htmlContent = generateQuotationHtml(inq);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.warn('Iframe print failed, falling back to window.print', err);
          window.print();
        }
      }, 300);
    } catch (e) {
      console.error('Print trigger failed:', e);
      window.print();
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = (inq) => {
    const quoteData = inq.quote_data || {};
    const quoteRef = `US-Q-${inq.id.slice(0, 8).toUpperCase()}`;
    const grandTotal = Number(quoteData.grand_total || inq.expected_value || 0).toLocaleString('en-IN');
    const items = quoteData.items || inq.items || [];
    const itemsStr = items.map(i => {
      const mat = formatMatrixSummary(i.section_matrix || i.custom_specifications?.section_matrix, i.unit || 'MT');
      const matText = mat ? `\n    └ Matrix: ${mat}` : '';
      return `• ${i.product_name || i.name}: ${i.quantity || i.qty} ${i.unit || 'MT'} @ ₹${Number(i.quoted_rate || i.unit_price || i.base_price || 0).toLocaleString('en-IN')}${matText}`;
    }).join('\n');

    const msg = `*Urbanspan Commercial Steel Quotation*` +
      `\n*Ref:* ${quoteRef}` +
      `\n*Client:* ${customerUser?.company || customerUser?.name || inq.name}` +
      `\n\n*Items:*\n${itemsStr}` +
      `\n\n*Total Value (incl. 18% GST):* ₹${grandTotal}` +
      `\n*Supply Terms:* ${quoteData.delivery_type === 'for' ? 'F.O.R. Site Delivered' : 'Ex-Mill Gate'}` +
      `\n\nView in portal: https://www.urbanspaninfra.co.in/portal`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copy Quotation Summary to Clipboard
  const handleCopyQuoteText = (inq) => {
    const quoteData = inq.quote_data || {};
    const quoteRef = `US-Q-${inq.id.slice(0, 8).toUpperCase()}`;
    const grandTotal = Number(quoteData.grand_total || inq.expected_value || 0).toLocaleString('en-IN');
    const items = quoteData.items || inq.items || [];
    const itemsStr = items.map(i => {
      const mat = formatMatrixSummary(i.section_matrix || i.custom_specifications?.section_matrix, i.unit || 'MT');
      const matText = mat ? `\n    └ Matrix: ${mat}` : '';
      return `• ${i.product_name || i.name}: ${i.quantity || i.qty} ${i.unit || 'MT'} @ ₹${Number(i.quoted_rate || i.unit_price || i.base_price || 0).toLocaleString('en-IN')}${matText}`;
    }).join('\n');

    const text = `UrbanSpan Commercial Quotation (${quoteRef})\n` +
      `Client: ${customerUser?.company || customerUser?.name || inq.name}\n\n` +
      `${itemsStr}\n\n` +
      `Total Value: ₹${grandTotal}\n` +
      `Terms: ${quoteData.delivery_type === 'for' ? 'F.O.R. Delivered' : 'Ex-Plant Raipur'}`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleGenerateInvoicePdf = (order, dispatch) => {
    if (!dispatch) {
      alert('Consignment dispatch data unavailable for invoice generation.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download or print the Tax Invoice.');
      return;
    }

    const invoiceNo = dispatch.customer_invoice_no || `US-INV-${new Date().getFullYear()}-${dispatch.consignment_number ? String(dispatch.consignment_number).slice(-4) : '0099'}`;
    const invoiceDate = dispatch.dispatch_date || new Date().toISOString().slice(0, 10);
    const truckNo = dispatch.truck_number || 'Trailer';
    const ewayBill = dispatch.eway_bill_no || '9918273645';
    const driverName = dispatch.driver_name || 'Assigned Driver';
    const driverPhone = dispatch.driver_phone || '';
    const netWeight = Number(dispatch.net_weight || dispatch.dispatched_quantity || 35.000);
    const clientName = customerUser?.name || 'Valued Client';
    const companyName = customerUser?.company || order.title || 'Client Organization';
    const gstin = customerUser?.gstin || customerUser?.gst_number || '23AAGCS9988H1Z4';
    const address = customerUser?.address || 'Project Jobsite, Madhya Pradesh';

    const contractedQty = Number(order.custom_data?.total_tonnage || order.quantity_mt || 50);
    const ratePerMT = order.deal_value && contractedQty > 0
      ? Math.round(Number(order.deal_value) / contractedQty)
      : 52000;
    const subtotal = Math.round(netWeight * ratePerMT);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const totalAmount = subtotal + cgst + sgst;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TAX INVOICE - ${invoiceNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }
            .invoice-card { max-width: 860px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 8px; padding: 24px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; font-size: 12px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
            .table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
            .table th { background: #0f172a; color: #fff; padding: 8px; text-align: left; text-transform: uppercase; font-size: 10px; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
            .totals { width: 340px; margin-left: auto; font-size: 12px; }
            .totals td { padding: 4px 8px; }
            @media print {
              body { padding: 0; }
              .invoice-card { border: 1px solid #000; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 860px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="window.print()" style="background: #1e3a8a; color: #fff; border: none; padding: 10px 24px; font-weight: bold; border-radius: 6px; cursor: pointer;">
              🖨️ Print / Save Tax Invoice (PDF)
            </button>
          </div>
          <div class="invoice-card">
            <div class="header">
              <div>
                <div style="font-size: 20px; font-weight: 900; color: #1e3a8a;">URBANSPAN INFRASTRUCTURE PVT. LTD.</div>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">Primary Steel Distributor & Stockyard Logistics Hub</div>
                <div style="font-size: 11px; font-weight: 600;">115 Scheme 97, Vanijyak Mandi, Indore, Madhya Pradesh - 452009</div>
                <div style="font-size: 11px; font-weight: bold; color: #1e3a8a; margin-top: 2px;">GSTIN: 23AADCU4530F1ZQ • PAN: AADCU4530F</div>
              </div>
              <div style="text-align: right;">
                <div style="display: inline-block; background: #1e3a8a; color: #fff; font-size: 13px; font-weight: 900; padding: 4px 12px; border-radius: 4px; text-transform: uppercase;">
                  TAX INVOICE
                </div>
                <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">${invoiceNo}</div>
                <div style="font-size: 11px; color: #64748b;">Date: ${invoiceDate}</div>
              </div>
            </div>

            <div class="grid-2">
              <div class="box">
                <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase; font-size: 11px;">Billed To (Customer):</div>
                <div style="font-weight: bold; font-size: 13px;">${companyName}</div>
                <div>Attn: ${clientName}</div>
                <div>${address}</div>
                <div style="margin-top: 4px; font-weight: bold; color: #0f172a;">GSTIN: ${gstin}</div>
              </div>
              <div class="box">
                <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase; font-size: 11px;">Consignment & Logistics Details:</div>
                <div><strong>Vehicle No:</strong> ${truckNo}</div>
                <div><strong>Driver:</strong> ${driverName} ${driverPhone ? `(${driverPhone})` : ''}</div>
                <div><strong>e-Way Bill No:</strong> EWB-${ewayBill}</div>
                <div><strong>Delivery Destination:</strong> ${address}</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th>HSN / SAC</th>
                  <th style="text-align: center;">Qty (MT)</th>
                  <th style="text-align: right;">Rate (₹/MT)</th>
                  <th style="text-align: right;">Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>High Ductility TMT Steel Rebars (Fe-550D)</strong>
                    <div style="font-size: 10px; color: #64748b;">Conforming to IS 1786:2008 Grade Fe-550D • Tested & Certified</div>
                  </td>
                  <td>7214</td>
                  <td style="text-align: center; font-weight: bold;">${netWeight.toFixed(3)} MT</td>
                  <td style="text-align: right; font-weight: 600;">₹${ratePerMT.toLocaleString('en-IN')}</td>
                  <td style="text-align: right; font-weight: bold;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <table class="totals">
              <tr>
                <td>Subtotal (Taxable Value):</td>
                <td style="text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Central GST (CGST @ 9%):</td>
                <td style="text-align: right; font-weight: 600;">₹${cgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>State GST (SGST @ 9%):</td>
                <td style="text-align: right; font-weight: 600;">₹${sgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
                <td style="font-size: 14px; font-weight: 900; color: #1e3a8a; padding: 6px 0;">Invoice Total:</td>
                <td style="font-size: 15px; font-weight: 900; color: #1e3a8a; text-align: right; padding: 6px 0;">₹${totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div>
                <strong>Bank RTGS / NEFT Details:</strong><br/>
                Bank: Axis Bank Ltd • Branch: Indore Branch<br/>
                Account Name: URBANSPAN INFRASTRUCTURE PVT. LTD.<br/>
                A/C No: 10209376111 • IFSC: IDFB0041264
              </div>
              <div style="text-align: right; padding-top: 24px;">
                <strong>For URBANSPAN INFRASTRUCTURE PVT. LTD.</strong><br/><br/>
                <span style="font-size: 10px; color: #64748b;">Authorised Signatory</span>
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

  const handleOpenConfirmDeliveryModal = (order, tr) => {
    setConfirmDeliveryModal({
      isOpen: true,
      orderId: order.id,
      consignmentId: tr.id,
      truckNumber: tr.truck_number || 'Trailer',
      netWeight: tr.net_weight || tr.net_weight_mt || tr.quantity_mt || null,
      invoiceNo: tr.customer_invoice_no || '',
      isSubmitting: false,
      error: null
    });
  };

  const handleExecuteDeliveryConfirmation = async () => {
    const { orderId, consignmentId, truckNumber } = confirmDeliveryModal;
    if (!orderId || !consignmentId) return;

    try {
      setConfirmDeliveryModal(prev => ({ ...prev, isSubmitting: true, error: null }));
      const res = await confirmCustomerDelivery(orderId, consignmentId);
      if (res?.success) {
        setConfirmDeliveryModal({
          isOpen: false,
          orderId: null,
          consignmentId: null,
          truckNumber: '',
          netWeight: null,
          invoiceNo: '',
          isSubmitting: false,
          error: null
        });
        setToastNotification({
          type: 'success',
          message: `Delivery receipt confirmed for ${truckNumber}. Your order status has been updated!`
        });
        setTimeout(() => setToastNotification(null), 5000);
        await fetchOrders();
      } else {
        setConfirmDeliveryModal(prev => ({ ...prev, isSubmitting: false, error: res?.message || 'Failed to confirm delivery.' }));
      }
    } catch (err) {
      console.error('Confirm delivery error:', err);
      setConfirmDeliveryModal(prev => ({ ...prev, isSubmitting: false, error: err.response?.data?.message || 'Network error while confirming delivery. Please try again.' }));
    }
  };

  if (customerUser) {
    return (
      <>
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
                {customerUser.category && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    🏷️ {customerUser.category}
                  </span>
                )}
                {customerUser.city && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    📍 {customerUser.city}
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
                onClick={() => setActivePortalTab('orders')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'orders'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Active Supply Contracts ({activeOrders.length})</span>
              </button>
            </div>

            {/* TAB 1: INQUIRIES & QUOTATIONS */}
            {activePortalTab === 'inquiries' && (
              <div>
                {inquiriesLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading commercial quotes...</div>
                ) : inquiries.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">No active commercial inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">Submit an RFQ from our product catalog to track your live quotations and mill schedules.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => {
                      const statusMap = {
                        new: { label: 'Inquiry Received', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
                        contacted: { label: 'Pricing Desk Review', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
                        qualified: { label: 'Under Negotiation', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
                        proposal: { label: 'Quotation Ready', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                        converted: { label: 'Contract Active', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
                        lost: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600' }
                      };
                      const status = inq.status || 'new';
                      const statusInfo = statusMap[status] || { label: status.toUpperCase(), color: 'bg-slate-100 text-slate-700' };

                      const inquiryTitle = inq.items?.[0]?.product_name 
                        ? `${inq.items[0].product_name}${inq.items.length > 1 ? ` (+${inq.items.length - 1} items)` : ''} RFQ`
                        : inq.name || inq.title || 'Steel Procurement RFQ';

                      const quoteData = inq.quote_data || {};
                      const isQuoteConfirmedByStaff = inq.quote_status === 'confirmed' || inq.quote_status === 'dispatched' || inq.status === 'converted' || inq.status === 'won';
                      const isQuoteApprovedByManagement = inq.quote_status === 'approved';
                      const isQuotePendingApproval = inq.quote_status === 'pending_approval';
                      const hasConfirmedQuote = isQuoteConfirmedByStaff && quoteData && (quoteData.items || quoteData.base_subtotal || quoteData.grand_total);
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
                                  <span> • Account Manager: <b className="text-slate-700">{inq.assigned_rep_name}</b></span>
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
                                        <th className="py-2 px-2 font-semibold text-center">Quantity</th>
                                        <th className="py-2 px-2 font-semibold text-right">Quoted Rate</th>
                                        <th className="py-2 px-2 font-semibold text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {quoteData.items.map((item, idx) => {
                                         const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, item.unit || 'MT');
                                         return (
                                           <tr key={idx}>
                                             <td className="py-2 px-2 font-bold text-slate-800">
                                               <div>{item.product_name || item.name}</div>
                                               {item.notes && <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>}
                                               {matSummary && (
                                                 <div className="mt-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                                                   📐 Section Matrix: {matSummary}
                                                 </div>
                                               )}
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
                                         );
                                       })}
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

                              {/* In-App Quotation Viewer Trigger Button */}
                              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openQuotePreviewModal(inq)}
                                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-98"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View & Download Official Quote</span>
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
                                  {inq.items.map((item, idx) => {
                                    const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, item.product_unit || item.unit || 'MT');
                                    return (
                                      <div key={idx} className="space-y-0.5">
                                        <div className="flex justify-between items-center text-slate-800 font-medium">
                                          <span>• {item.product_name || item.name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                          <span className="font-bold">{item.quantity || item.custom_specifications?.requested_quantity || 1} {item.product_unit || item.unit || 'MT'}</span>
                                        </div>
                                        {matSummary && (
                                          <div className="text-[10px] text-indigo-700 font-semibold pl-3">
                                            📐 Section Matrix: {matSummary}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* 3. Inquiry Received & Pricing Desk Review (Unconfirmed) */
                            <div className="space-y-3">
                              {inq.items && inq.items.length > 0 && (
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                                  <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Requested Material Specifications:</div>
                                  {inq.items.map((item, idx) => {
                                    const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, item.product_unit || item.unit || 'MT');
                                    return (
                                      <div key={idx} className="border-b border-slate-100 last:border-0 pb-1.5 last:pb-0 space-y-0.5">
                                        <div className="flex justify-between items-center text-slate-700 font-medium">
                                          <span>• {item.product_name || item.name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                          <span className="font-bold text-slate-900">
                                            {item.quantity || item.custom_specifications?.requested_quantity || 1} {item.product_unit || item.unit || 'MT'}
                                            {item.base_price ? ` @ ₹${Number(item.base_price).toLocaleString('en-IN')}/${item.product_unit || 'MT'}` : ''}
                                          </span>
                                        </div>
                                        {matSummary && (
                                          <div className="text-[10px] text-indigo-700 font-semibold pl-3">
                                            📐 Section Matrix: {matSummary}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {isQuoteApprovedByManagement ? (
                                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5 shadow-sm">
                                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0 animate-pulse" />
                                  <div>
                                    <div className="font-bold text-blue-950">Pricing Authorized — Final Account Manager Verification</div>
                                    <div className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                                      Commercial pricing has been authorized by management. Your account manager ({inq.assigned_rep_name || 'Commercial Desk'}) is finalizing dispatch logistics and contract terms, and will release your official downloadable quote shortly.
                                    </div>
                                  </div>
                                </div>
                              ) : isQuotePendingApproval ? (
                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-sm">
                                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                  <div>
                                    <div className="font-bold text-amber-950">Management Pricing Authorization in Progress</div>
                                    <div className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                                      Your spot quotation is currently undergoing commercial authorization with our pricing directors. Official proforma quote and downloadable PDF will be unlocked once approved and released.
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
                                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                  <div>
                                    <div className="font-bold text-blue-950">Pricing Desk Review in Progress</div>
                                    <div className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                                      Our commercial desk is verifying mill rolling schedules, freight logistics, and spot rates for your requirement. Your official confirmed quote and downloadable PDF will be made available here once confirmed by our sales desk.
                                    </div>
                                  </div>
                                </div>
                              )}
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
                                <Phone className="w-3.5 h-3.5" /> Call Account Manager ({inq.assigned_rep_phone})
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

                      // 2. Extract live fleet dispatches (syncing backend consignments, split fleet array, and single-truck dispatch_details)
                      let fleetDispatches = (Array.isArray(order.fleet_dispatches) && order.fleet_dispatches.length > 0)
                        ? order.fleet_dispatches
                        : (Array.isArray(order.consignments) && order.consignments.length > 0)
                        ? order.consignments.map(c => ({
                            id: c.id,
                            consignment_number: c.consignment_number,
                            truck_number: c.truck_number || 'Trailer',
                            driver_name: c.driver_name || 'Assigned Driver',
                            driver_phone: c.driver_phone || '',
                            dispatched_quantity: Number(c.net_weight || c.tonnage || 0),
                            gross_weight: c.gross_weight ? Number(c.gross_weight) : null,
                            tare_weight: c.tare_weight ? Number(c.tare_weight) : null,
                            net_weight: Number(c.net_weight || c.tonnage || 0),
                            eway_bill_no: c.eway_bill_no || '',
                            customer_invoice_no: c.customer_invoice_no || '',
                            customer_invoice_url: c.customer_invoice_url || null,
                            dispatch_date: c.created_at ? (typeof c.created_at === 'string' ? c.created_at.slice(0, 10) : new Date(c.created_at).toISOString().slice(0, 10)) : null,
                            status: (c.tracking_status === 'delivered' || c.billing_stage === 'paid_reconciled')
                              ? 'Delivered'
                              : (c.billing_stage === 'invoiced_in_transit' || c.tracking_status === 'in_transit')
                              ? 'In Transit'
                              : 'Loaded'
                          }))
                        : (order.custom_data?.sub_entities?.fleet_dispatches || order.custom_data?.fleet_dispatches || []);

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
                              {order.items.map((item, idx) => {
                                const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, item.product_unit || 'MT');
                                return (
                                  <div key={idx} className="flex justify-between items-center text-slate-700 font-medium border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span>• {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                      {matSummary && (
                                        <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                          📐 {matSummary}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold text-slate-900 shrink-0">{item.quantity} {item.product_unit || 'MT'} @ ₹{Number(item.unit_price).toLocaleString('en-IN')}/{item.product_unit || 'MT'}</span>
                                  </div>
                                );
                              })}
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
                                        <td className="py-2.5 font-bold text-slate-900">
                                          <div className="flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span>{tr.truck_number || 'Trailer'}</span>
                                          </div>
                                          {tr.consignment_number && (
                                            <div className="text-[10px] font-mono text-slate-400 font-normal">
                                              {tr.consignment_number}
                                            </div>
                                          )}
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
                                          {tr.eway_bill_no ? (
                                            <div>{tr.eway_bill_no.startsWith('EWB') ? tr.eway_bill_no : `EWB-${tr.eway_bill_no}`}</div>
                                          ) : (
                                            <div>—</div>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleGenerateInvoicePdf(order, tr)}
                                            className="mt-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-sans font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                                            title="Download / Print Official GST Tax Invoice (PDF)"
                                          >
                                            <FileText className="w-3 h-3 text-indigo-600" />
                                            <span>{tr.customer_invoice_no || 'US-INV-2026-0099'}</span>
                                          </button>
                                        </td>
                                        <td className="py-2.5 text-[11px] text-slate-500">
                                          {tr.dispatch_date || '—'}
                                        </td>
                                        <td className="py-2.5 text-right">
                                          <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                              tr.status === 'Delivered'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : tr.status === 'In Transit'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}>
                                              {tr.status || 'Loaded'}
                                            </span>

                                            {tr.pod_url && (
                                              <a
                                                href={tr.pod_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-300"
                                                title="View Stamped Weighbridge Scale Slip / POD"
                                              >
                                                <FileText className="w-2.5 h-2.5 text-emerald-600" /> POD Slip
                                              </a>
                                            )}
                                          </div>

                                          {tr.status !== 'Delivered' && (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenConfirmDeliveryModal(order, tr)}
                                              className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                                            >
                                              <CheckCircle2 className="w-3 h-3" /> Confirm Received on Site
                                            </button>
                                          )}
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

        {/* IN-APP OFFICIAL QUOTATION VIEWER & DOWNLOAD MODAL */}
        {selectedQuoteForPreview && (
          <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 pb-20 sm:pb-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] border border-slate-200">
              
              {/* Modal Top Header with Clear Back & Action Controls */}
              <div className="px-4 sm:px-5 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForPreview(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold shrink-0"
                    title="Back to My Quotes"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                      Official Quotation
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white font-mono truncate">
                      US-Q-{selectedQuoteForPreview.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePrintQuotation(selectedQuoteForPreview)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-98"
                    title="Print or Save PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print / Save PDF</span>
                    <span className="sm:hidden">Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(selectedQuoteForPreview)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-98"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyQuoteText(selectedQuoteForPreview)}
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold"
                    title="Copy Quote Text"
                  >
                    {copiedQuote ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForPreview(null)}
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Quotation Preview Body */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/60">
                {(() => {
                  const inq = selectedQuoteForPreview;
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
                  const todayStr = new Date(inq.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                  const template = quoteData.template || {};
                  const companyNameHeader = template.company_name || 'UrbanSpan Infrastructure Pvt Ltd';
                  const companyTagline = template.company_tagline || 'Primary Steel Distribution · Raipur & Indore Industrial Hubs';
                  const companyGstin = template.gstin || '23AADCU4530F1ZQ';
                  const companyPan = template.pan_number || 'AADCU4530F';
                  const bankName = template.bank_name || 'Axis Bank Ltd';
                  const bankAccountNo = template.bank_account_no || '10209376111';
                  const bankIfsc = template.bank_ifsc || 'IDFB0041264';
                  const bankBranch = template.bank_branch || 'Indore Branch';

                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
                      
                      {/* Quotation Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-indigo-600">
                        <div>
                          <div className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
                            {companyNameHeader}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {companyTagline}
                          </div>
                          <div className="text-xs font-semibold text-slate-700 mt-0.5">
                            GSTIN: {companyGstin}{companyPan ? ` | PAN: ${companyPan}` : ''}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider">
                            Commercial Quotation
                          </div>
                          <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                            Ref: {quoteRef}
                          </div>
                          <div className="text-xs text-slate-500">
                            Date: {todayStr}
                          </div>
                        </div>
                      </div>

                      {/* Client & Delivery Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Billed & Supplied To
                          </span>
                          <div className="text-sm font-bold text-slate-900">{clientName}</div>
                          {companyName && <div className="font-semibold text-slate-700">{companyName}</div>}
                          {clientPhone && <div className="text-slate-600 mt-0.5">Phone: {clientPhone}</div>}
                          {clientEmail && <div className="text-slate-600">Email: {clientEmail}</div>}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Commercial Delivery Terms
                          </span>
                          <div className="font-bold text-indigo-900 flex items-center gap-2">
                            <span>{isFOR ? 'F.O.R. Delivered Destination' : 'Ex-Plant / Ex-Mill Gate'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isFOR ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                              {isFOR ? 'F.O.R.' : 'EXW'}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            Destination: <strong className="text-slate-800">{deliveryDestination}</strong>
                          </div>
                          <div className="text-red-600 font-semibold mt-0.5">
                            Rate Validity: 24 Hours Spot Rate
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200">
                              <th className="py-2.5 px-3 font-bold w-8">#</th>
                              <th className="py-2.5 px-3 font-bold">Item Description</th>
                              <th className="py-2.5 px-3 font-bold text-center">Quantity</th>
                              <th className="py-2.5 px-3 font-bold text-right">Quoted Rate</th>
                              <th className="py-2.5 px-3 font-bold text-right">Taxable Subtotal</th>
                              <th className="py-2.5 px-3 font-bold text-right">18% GST</th>
                              <th className="py-2.5 px-3 font-bold text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {items.map((item, idx) => {
                              const qty = Number(item.quantity || item.qty || 1);
                              const unit = item.unit || 'MT';
                              const rate = Number(item.quoted_rate || item.unit_price || item.benchmark_rate || item.base_price || 0);
                              const itemSubtotal = Number(item.subtotal || (qty * rate));
                              const itemGst = itemSubtotal * 0.18;
                              const itemLineTotal = itemSubtotal + itemGst;

                              const matSummary = formatMatrixSummary(item.section_matrix || item.custom_specifications?.section_matrix, unit);

                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-3 font-bold text-slate-900">{idx + 1}</td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{item.product_name || item.name}</div>
                                    <div className="text-[10px] text-slate-400">IS 1786:2008 Fe-550D High Ductility {item.notes ? `• ${item.notes}` : ''}</div>
                                    {matSummary && (
                                      <div className="mt-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                                        📐 Section Matrix: {matSummary}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-slate-800">
                                    {qty.toFixed(2)} {unit}
                                  </td>
                                  <td className="py-3 px-3 text-right font-semibold text-slate-800">
                                    ₹{rate.toLocaleString('en-IN')}/{unit}
                                  </td>
                                  <td className="py-3 px-3 text-right font-semibold text-slate-800">
                                    ₹{Math.round(itemSubtotal).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-3 px-3 text-right text-slate-500">
                                    ₹{Math.round(itemGst).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-3 px-3 text-right font-black text-indigo-700">
                                    ₹{Math.round(itemLineTotal).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Totals Breakdown */}
                      <div className="flex justify-end pt-2">
                        <div className="w-full sm:w-80 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex justify-between text-slate-600">
                            <span>Material Basic Subtotal:</span>
                            <span className="font-bold text-slate-900">₹{Math.round(materialSubtotal).toLocaleString('en-IN')}</span>
                          </div>

                          {loadingAmount > 0 && (
                            <div className="flex justify-between text-sky-700 font-semibold">
                              <span>Loading Charges {loadingDetails ? `(${loadingDetails})` : ''}:</span>
                              <span>+₹{Math.round(loadingAmount).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {isFOR && freightAmount > 0 && (
                            <div className="flex justify-between text-blue-700 font-semibold">
                              <span>Freight Charges {freightDetails ? `(${freightDetails})` : ''}:</span>
                              <span>+₹{Math.round(freightAmount).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                            <span>Total Taxable Base Value:</span>
                            <span>₹{Math.round(taxableSubtotal).toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between text-slate-500">
                            <span>CGST (9.0%):</span>
                            <span>₹{Math.round(taxAmount / 2).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>SGST (9.0%):</span>
                            <span>₹{Math.round(taxAmount / 2).toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between items-baseline pt-2 border-t-2 border-indigo-600 font-black text-sm text-indigo-950">
                            <span>Consignment Grand Total:</span>
                            <span className="text-base text-indigo-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quotation Notes */}
                      {quoteNotes && quoteNotes.trim() && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold block mb-1">📌 Special Quotation Terms & Dispatch Notes:</span>
                          <p className="leading-relaxed m-0 whitespace-pre-line">{quoteNotes}</p>
                        </div>
                      )}

                      {/* Commercial Terms & Conditions */}
                      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                        <span className="font-bold text-slate-700 block mb-1">Standard Commercial Terms & Conditions:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <div>• <strong>Payment Terms:</strong> 100% RTGS Advance against Proforma Invoice</div>
                            <div>• <strong>Supply Terms:</strong> {isFOR ? 'F.O.R. Destination Delivered' : 'Ex-Mill Raipur Gate'}</div>
                            <div>• <strong>Tolerance:</strong> Standard IS 1786 rolling tolerance ±0.5%</div>
                          </div>
                          <div>
                            <div>• <strong>Bank:</strong> {bankName} (A/C: {bankAccountNo})</div>
                            <div>• <strong>IFSC:</strong> {bankIfsc} ({bankBranch})</div>
                            <div>• <strong>MTC:</strong> Original Mill Test Certificate provided upon loading.</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Modal Bottom Footer Navigation Bar */}
              <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForPreview(null)}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(selectedQuoteForPreview)}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintQuotation(selectedQuoteForPreview)}
                    className="px-3.5 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

        {/* In-Website Delivery Confirmation Modal (No Browser Popups, Zero ERP Jargon) */}
        {confirmDeliveryModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-7 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Confirm Site Delivery</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify material arrival at your project site</p>
                </div>
              </div>

              {/* Consignment details card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Truck / Trailer:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmDeliveryModal.truckNumber}</span>
                </div>
                {confirmDeliveryModal.netWeight && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Net Dispatched Weight:</span>
                    <span className="font-bold text-slate-900">{confirmDeliveryModal.netWeight} MT</span>
                  </div>
                )}
                {confirmDeliveryModal.invoiceNo && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tax Invoice:</span>
                    <span className="font-mono font-semibold text-indigo-600">{confirmDeliveryModal.invoiceNo}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Has this consignment arrived and been verified by your site team? Confirming receipt will mark this truckload as delivered and update your order fulfillment tracker.
              </p>

              {confirmDeliveryModal.error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{confirmDeliveryModal.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={confirmDeliveryModal.isSubmitting}
                  onClick={() => setConfirmDeliveryModal({ isOpen: false, orderId: null, consignmentId: null, truckNumber: '', netWeight: null, invoiceNo: '', isSubmitting: false, error: null })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmDeliveryModal.isSubmitting}
                  onClick={handleExecuteDeliveryConfirmation}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {confirmDeliveryModal.isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating in-app Toast Notification */}
        {toastNotification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toastNotification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {toastNotification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <p className="text-xs font-medium">{toastNotification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`py-12 mx-auto px-4 transition-all duration-300 ${isRegisterMode ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="bg-white shadow-xl border border-slate-200 p-6 sm:p-10 rounded-3xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200 text-white">
            {isRegisterMode ? <UserPlus className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isRegisterMode ? 'Create New Client Account' : 'Urbanspan Client Sign In'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-lg mx-auto leading-relaxed">
            {isRegisterMode 
              ? 'Register your company profile for personalized wholesale pricing, instant commercial proforma quotes, and live order tracking.'
              : 'Access your steel supply contracts, live trailer dispatches & weighbridge records.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegisterMode ? (
            <>
              {/* Section 1: Contact & Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact &amp; Account Credentials</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amit Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 98260 12345"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="amit@metroinfra.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Set Portal Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPortalPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPortalPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPortalPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Business & Self-Categorization */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Company &amp; Business Profile</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Organization Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro Infra Projects Ltd"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        GSTIN (GST Number)
                      </label>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 23AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-600 uppercase transition-colors"
                      />
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">For B2B 18% Input Tax Credit (ITC) on proforma invoices</p>
                  </div>
                </div>

                {/* Client Category Selection (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      How do you categorize your business?
                    </label>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CLIENT_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = formData.category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, category: isSelected ? '' : cat.id })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected 
                              ? 'bg-indigo-50/80 border-indigo-600 shadow-xs ring-1 ring-indigo-600' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {cat.label}
                              </span>
                              {isSelected && <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{cat.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Project Location & Sourcing Hub */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Location &amp; Dispatch Hub</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Delivery City / Hub
                    </label>
                    <div className="relative">
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 appearance-none transition-colors"
                      >
                        {REGIONAL_HUBS.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Project Site / Office Address
                      </label>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Super Corridor Road, Indore"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Sign In Mode */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="amit.buyer@metroinfra.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPortalPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPortalPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-4 transition-all active:scale-98 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Client Account &amp; Access Wholesale Rates</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Customer Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            {isRegisterMode ? '← Already have an account? Sign in' : "Don't have a client account? Create new client account ➔"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="font-semibold text-slate-600">Urbanspan {appVersion || 'v1.2.0'}</span>
          <button 
            type="button" 
            onClick={onCheckUpdate} 
            disabled={isUpdating}
            className="text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Checking...' : 'Check Updates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
