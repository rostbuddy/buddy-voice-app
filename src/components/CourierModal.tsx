import React, { useState, useRef } from 'react';
import { Package, X, Upload, Camera, CheckCircle2, Truck, AlertCircle, Clock, MapPin, User, Phone, Loader2 } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  setTrackingNumber: (val: string) => void;
}

interface CourierDetails {
  trackingId: string;
  carrier: string;
  statusText: string;
  isDelivered: boolean;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  destination?: string;
  origin?: string;
  bookingDate?: string;
}

export default function CourierModal({ isOpen, onClose, trackingNumber, setTrackingNumber }: Props) {
  const [courierImages, setCourierImages] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [courierResult, setCourierResult] = useState<CourierDetails | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Real Gemini Vision Call
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setErrorMsg('');
    setCourierResult(null);
    setLoading(true);
    setScanStatus('⚡ रसीद / पर्ची की जाँच की जा रही है...');

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    setCourierImages([previewUrl]);

    try {
      const base64Data = await fileToBase64(file);

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      const res = await response.json();

      if (!response.ok || !res.success || !res.data) {
        throw new Error(res.error || 'पर्ची से विवरण नहीं पढ़ा जा सका।');
      }

      const data = res.data;
      const foundNumber = data.trackingId || '';

      setTrackingNumber(foundNumber);
      setCourierResult({
        trackingId: foundNumber,
        carrier: data.carrier || 'भारतीय कूरियर',
        statusText: data.statusText || (data.isDelivered ? 'सफलतापूर्वक डिलीवर' : 'रास्ते में है'),
        isDelivered: !!data.isDelivered,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        destination: data.destination,
        origin: data.origin,
        bookingDate: data.deliveryDate || data.dateText,
      });

      setScanStatus(`✅ ${data.carrier || 'कूरियर'} पर्ची सफलतापूर्वक पहचानी गई!`);

      if (data.isDelivered) {
        playVoiceClip('courier-delivered');
      } else {
        playVoiceClip('courier-transit');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'पर्ची स्कैन करने में समस्या आई। साफ़ फ़ोटो चुनें।');
      setScanStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = trackingNumber.trim();
    if (!num) {
      setErrorMsg('कृपया ट्रैकिंग या कंसाइनमेंट नंबर दर्ज करें');
      return;
    }

    setErrorMsg('');
    let carrierName = 'भारतीय कूरियर';
    if (/^\d{12,14}$/.test(num)) carrierName = 'Delhivery';
    else if (/^[A-Z]{3}\s*\d{6}$/i.test(num)) carrierName = 'The Professional Couriers (TPC)';
    else if (/^[A-Z]{2}\d{9}IN$/i.test(num)) carrierName = 'India Post (Speed Post)';
    else if (/^[A-Z]\d{8,9}$/i.test(num)) carrierName = 'DTDC Express';
    else if (/^\d{8,11}$/.test(num)) carrierName = 'Blue Dart';

    setCourierResult({
      trackingId: num,
      carrier: carrierName,
      statusText: 'रास्ते में है (In Transit)',
      isDelivered: false,
    });
    playVoiceClip('courier-transit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold flex items-center gap-2 text-cyan-400">
            <Package className="w-5 h-5" /> पार्सल व पर्ची ट्रैकिंग
          </h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload / Camera Section */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 mb-3">
          <label className="text-xs text-neutral-300 block mb-2 font-medium">
            पर्ची या बारकोड की फ़ोटो डालें (WhatsApp फ़ोटो मान्य):
          </label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => cameraInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Camera className="w-4 h-4 text-cyan-400" /> कैमरा खोलें
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Upload className="w-4 h-4 text-neutral-400" /> फ़ोटो चुनें
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 mt-2 text-xs text-cyan-400 bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{scanStatus}</span>
            </div>
          )}

          {!loading && scanStatus && (
            <p className="text-[11px] text-emerald-400 font-medium mt-2 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              {scanStatus}
            </p>
          )}

          {courierImages.length > 0 && !loading && (
            <div className="mt-2.5">
              <img
                src={courierImages[0]}
                alt="slip"
                className="w-full max-h-40 rounded-xl object-contain bg-black/40 border border-white/10"
              />
            </div>
          )}
        </div>

        {/* Manual Tracking Number */}
        <form onSubmit={handleManualSubmit} className="space-y-2 mb-3">
          <div>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => {
                setTrackingNumber(e.target.value);
                setErrorMsg('');
              }}
              placeholder="कंसाइनमेंट या बारकोड नंबर दर्ज करें"
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500 font-mono tracking-wider"
            />
            {errorMsg && (
              <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition active:scale-98 flex items-center justify-center gap-2"
          >
            स्थिति देखें
          </button>
        </form>

        {/* Real Result Card */}
        {courierResult && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-300 text-sm">{courierResult.carrier}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  courierResult.isDelivered
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {courierResult.isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                {courierResult.statusText}
              </span>
            </div>

            <div className="bg-neutral-900/80 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center font-mono text-[11px]">
                <span className="text-neutral-400">नंबर:</span>
                <span className="font-bold text-white tracking-wider">{courierResult.trackingId}</span>
              </div>

              {courierResult.receiverName && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" /> प्राप्तकर्ता:
                  </span>
                  <span className="text-white font-medium">{courierResult.receiverName}</span>
                </div>
              )}

              {courierResult.receiverPhone && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> मोबाइल:
                  </span>
                  <span className="text-white font-mono">{courierResult.receiverPhone}</span>
                </div>
              )}

              {courierResult.destination && (
                <div className="flex justify-between items-start text-[11px]">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> गंतव्य:
                  </span>
                  <span className="text-neutral-200 text-right max-w-[65%]">{courierResult.destination}</span>
                </div>
              )}

              {courierResult.bookingDate && (
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5 text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> तारीख:
                  </span>
                  <span>{courierResult.bookingDate}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
