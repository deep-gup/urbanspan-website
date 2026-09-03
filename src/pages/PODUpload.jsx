import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Camera, Upload, CheckCircle2, AlertTriangle, Truck, Scale, MapPin, User, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { getPODDetails, uploadPOD } from '../services/headlessApi';

export default function PODUpload() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('deal_id') || searchParams.get('id');
  const dispatchId = searchParams.get('dispatch_id') || searchParams.get('consignment_id') || searchParams.get('cid');
  const orgCode = searchParams.get('org_code') || 'urbanspan_steel_1764';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  const [receiverName, setReceiverName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchDetails() {
      if (!orderId) {
        setError('Missing order_id in link. Please open the link received via WhatsApp or SMS.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getPODDetails(orderId, dispatchId);
        if (res?.success && res?.data) {
          setDetails(res.data);
          if (res.data.pod_url) {
            setUploadedUrl(res.data.pod_url);
            setUploadSuccess(true);
          }
        } else {
          setError('Could not locate consignment details. The order may have been archived.');
        }
      } catch (err) {
        console.error('Fetch POD Details Error:', err);
        setError(err.response?.data?.message || 'Failed to load consignment details. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [orderId, dispatchId, orgCode]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      alert('Please snap or select a photo of the stamped delivery challan / weighbridge slip.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('order_id', orderId);
      if (dispatchId) formData.append('dispatch_id', dispatchId);
      formData.append('org_code', orgCode);
      formData.append('receiver_name', receiverName || 'Site Receiver');
      formData.append('notes', notes || '');
      formData.append('file', selectedFile);

      const res = await uploadPOD(formData);

      if (res.data?.success) {
        setUploadSuccess(true);
        setUploadedUrl(res.data?.pod_url || res.data?.data?.pod_url);
      } else {
        alert(res.data?.message || 'Failed to record Proof of Delivery. Please try again.');
      }
    } catch (err) {
      console.error('Submit POD Error:', err);
      alert(err.response?.data?.message || 'Network error while uploading POD slip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Loading Consignment Details...</h2>
        <p className="text-slate-400 text-sm mt-1">Connecting to Urbanspan logistics server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black">Link Invalid or Expired</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">{error}</p>
        <Link to="/" className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-all">
          Return to Urbanspan Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-indigo-400" /> Urbanspan Dispatch & Fulfillment
          </div>
          <h1 className="text-2xl font-black text-white pt-1">Proof of Delivery (POD)</h1>
          <p className="text-xs text-slate-400">Zero-login site receiving & weighbridge scale slip submission</p>
        </div>

        {/* Consignment Overview Card */}
        {details && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order / Project</span>
                <h3 className="text-base font-extrabold text-white line-clamp-1">{details.title}</h3>
                <p className="text-xs text-indigo-400 font-semibold">{details.party_name}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                details.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {details.status || 'In Transit'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-medium block">Vehicle / Trailer</span>
                <span className="font-bold text-white text-sm flex items-center gap-1 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-400" /> {details.truck_number || 'Trailer'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-medium block">Net Tonnage</span>
                <span className="font-bold text-indigo-300 text-sm flex items-center gap-1 mt-0.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" /> {Number(details.dispatched_quantity || 0).toFixed(3)} MT
                </span>
              </div>
            </div>

            {(details.party_address || details.party_city) && (
              <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{details.party_address ? `${details.party_address}, ` : ''}{details.party_city}</span>
              </div>
            )}
          </div>
        )}

        {/* Success Confirmation State */}
        {uploadSuccess ? (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Delivery Confirmed & Slip Recorded</h2>
              <p className="text-xs text-emerald-300/80 mt-1">
                The Proof of Delivery (POD) slip has been synced to Urbanspan ERP and the Customer Portal. Consignment status is now marked as <strong>Delivered</strong>.
              </p>
            </div>

            {uploadedUrl && (
              <div className="pt-2">
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md"
                >
                  <FileText className="w-4 h-4 text-emerald-400" /> View Uploaded POD Document ➔
                </a>
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Visit Urbanspan Infrastructure Website
              </Link>
            </div>
          </div>
        ) : (
          /* Active Camera & Upload Form */
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" /> Capture Stamped Slip or Weighbridge Ticket
              </h3>
              <p className="text-[11px] text-slate-400">
                Snap a clear photo of the driver's delivery challan, stamped gate pass, or weighbridge scale slip.
              </p>
            </div>

            {/* Hidden Native File Input with Camera Trigger */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Photo Capture Dropzone / Button */}
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500 bg-slate-950 shadow-inner group">
                <img src={previewUrl} alt="Slip Preview" className="w-full h-56 object-cover object-center" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Retake Photo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 flex items-center gap-1 shadow-md"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-700/60 hover:border-indigo-500 bg-indigo-950/20 hover:bg-indigo-950/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Tap to Open Camera & Take Photo</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Or select image from phone gallery</div>
                </div>
              </div>
            )}

            {/* Receiver Details */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Receiver Name / In-Charge (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="e.g. Suresh Kumar (Site Supervisor)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Site Notes / Tare Slip Remarks (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received 35 MT 16mm rebar bundles in good condition with test certificate."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (!selectedFile && !previewUrl)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                submitting || (!selectedFile && !previewUrl)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Uploading Stamped Slip to Urbanspan ERP...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Submit Proof of Delivery
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Support */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <div>Urbanspan Infrastructure Pvt. Ltd. • Indore Stockyard Logistics Desk</div>
          <div>Helpline: <a href="tel:+919826012345" className="text-indigo-400 hover:underline">+91 98260 12345</a></div>
        </div>
      </div>
    </div>
  );
}
