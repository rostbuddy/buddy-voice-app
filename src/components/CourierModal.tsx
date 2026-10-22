import React, { useState, useRef } from 'react';
import { Package, X, Upload, Camera, CheckCircle2, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  setTrackingNumber: (val: string) => void;
}

export default function CourierModal({ isOpen, onClose, trackingNumber, setTrackingNumber }: Props) {
  const [courierImages, setCourierImages] = useState<string[]>([]);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [carrierName, setCarrierName] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Native Barcode Detection from Uploaded Slip
  const processImageForBarcode = async (file: File) => {
    setScanStatus('⚡ पर्ची का बारकोड स्कैन हो रहा है...');
    setErrorMsg('');

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imgUrl;

    img.onload = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'itf', 'qr_code']
          });
          const detected = await barcodeDetector.detect(img);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            const raw = detected[0].rawValue.trim();
            setTrackingNumber(raw);
            setScanStatus(`बारकोड मिला: ${raw}`);
            return;
          }
        } catch {
          // bypass
        }
      }

      const nameMatch = file.name.match(/\d{9,14}/);
      if (nameMatch) {
        setTrackingNumber(nameMatch[0]);
        setScanStatus(`नंबर मिला: ${nameMatch[0]}`);
      } else {
        setScanStatus('फ़ोटो अपलोड हो गई। यदि नंबर खाली हो तो दर्ज करें।');
      }
    };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).slice(0, 5);
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    setCourierImages(prev => [...prev, ...newUrls].slice(0, 5));
    processImageForBarcode(newFiles[0]);
  };

  const removeImage = (index: number) => {
    setCourierImages(prev => prev.filter((_, i) => i !== index));
    if (courierImages.length <= 1) setScanStatus('');
  };

  // 100% In-App Secure Tracker (Zero External Redirect)
  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLiveUrl(null);

    const num = trackingNumber.trim().toUpperCase();
    if (!num) {
      setErrorMsg('कृपया पर्ची पर लिखा ट्रैकिंग नंबर दर्ज करें');
      return;
    }

    setLoading(true);

    let carrier = '';
    let trackingUrl = '';

    // Direct Secure Portal Mapping
    if (/^\d{12,14}$/.test(num)) {
      carrier = 'Delhivery Express';
      trackingUrl = `https://www.delhivery.com/tracking?wbn=${num}`;
    } else if (/^[A-Z]{2}\d{9}IN$/.test(num)) {
      carrier = 'India Post (Speed Post)';
      trackingUrl = `https://www.indiapost.gov.in/_layouts/15/dpt.cptc.va/trackconsignment.aspx`;
    } else if (/^[A-Z]\d{8,9}$/.test(num)) {
      carrier = 'DTDC Express';
      trackingUrl = `https://www.dtdc.in/tracking/shipment-tracking.asp?awbno=${num}`;
    } else if (/^\d{8,11}$/.test(num)) {
      carrier = 'Blue Dart';
      trackingUrl = `https://www.bluedart.com/tracking?trackNumber=${num}`;
    } else if (/^[A-Z]{3,4}\d{6,8}$/.test(num)) {
      carrier = 'The Professional Couriers (TPC)';
      trackingUrl = `https://www.tpcindia.com/`;
    } else {
      carrier = 'ऑल इंडिया कूरियर ट्रैकर';
      trackingUrl = `https://m.trackcourier.in/track?tracking_id=${num}`;
    }

    setCarrierName(carrier);
    setLiveUrl(trackingUrl);
    setLoading(false);
    playVoiceClip('courier-transit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-4 relative shadow-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold flex items-center gap-2 text-cyan-400">
            <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (40+ कूरियर)
          </h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Dual Camera & Gallery */}
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/5">
            <label className="text-xs text-neutral-300 block mb-2 font-medium">
              पर्ची या बारकोड स्कैन करें (अधिकतम 5):
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
              multiple
              ref={fileInputRef}
              onChange={e => handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Camera className="w-4 h-4 text-cyan-400" /> कैमरा खोलें
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Upload className="w-4 h-4 text-neutral-400" /> गैलरी से चुनें
              </button>
            </div>

            {scanStatus && (
              <p className="text-[11px] text-cyan-400 font-medium mt-1.5 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20">
                {scanStatus}
              </p>
            )}

            {courierImages.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {courierImages.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="slip" className="w-11 h-11 rounded-lg object-cover border border-cyan-500/30" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleTrack} className="space-y-2">
            <div>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => {
                  setTrackingNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="कंसाइनमेंट नंबर लिखें (उदा. Delhivery/SpeedPost)"
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500 font-mono tracking-wider"
              />
              {errorMsg && (
                <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'सत्यापन हो रहा है...' : 'लाइव स्थिति देखें'}
            </button>
          </form>

          {/* 100% IN-APP Live Viewer (Never Leaves App) */}
          {liveUrl && (
            <div className="mt-2 rounded-2xl bg-neutral-900 border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-neutral-800/90 px-3 py-2 flex items-center justify-between border-b border-white/10 text-xs">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {carrierName} (लाइव रिकॉर्ड)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const f = document.getElementById('tracking-frame') as HTMLIFrameElement;
                    if (f) f.src = f.src;
                  }}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw className="w-3 h-3" /> रीफ़्रेश
                </button>
              </div>

              {/* Secure Embedded Sandboxed In-App Browser Frame */}
              <div className="w-full h-80 bg-white relative">
                <iframe
                  id="tracking-frame"
                  src={liveUrl}
                  title="Live Courier Status"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>

              <div className="p-2 bg-neutral-950 text-center text-[10px] text-neutral-400 border-t border-white/5">
                🔒 सुरक्षित व निजी इन-ऐप व्यू • डेटा केवल आपके लिए दृश्यमान है
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
