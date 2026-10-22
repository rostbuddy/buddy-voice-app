import React, { useState, useRef } from 'react';
import { Package, X, Upload, Camera, CheckCircle2, Truck, AlertCircle, MapPin, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  setTrackingNumber: (val: string) => void;
}

export default function CourierModal({ isOpen, onClose, trackingNumber, setTrackingNumber }: Props) {
  const [courierImages, setCourierImages] = useState<string[]>([]);
  const [courierResult, setCourierResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Real Native Barcode Detection
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
            setScanStatus(`बारकोड नंबर दर्ज: ${raw}`);
            return;
          }
        } catch {
          // bypass
        }
      }

      const nameMatch = file.name.match(/\d{9,14}/);
      if (nameMatch) {
        setTrackingNumber(nameMatch[0]);
        setScanStatus(`नंबर पहचाना गया: ${nameMatch[0]}`);
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

  // Real Tracking Call to Cloudflare Edge Function (/api/track)
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCourierResult(null);

    const num = trackingNumber.trim();
    if (!num) {
      setErrorMsg('कृपया पर्ची पर लिखा ट्रैकिंग नंबर दर्ज करें');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: num }),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        setErrorMsg(res.error || 'यह अमान्य ट्रैकिंग नंबर है।');
        setLoading(false);
        return;
      }

      setCourierResult(res.data);

      if (res.data.isDelivered) {
        playVoiceClip('courier-delivered');
      } else {
        playVoiceClip('courier-transit');
      }
    } catch {
      setErrorMsg('ट्रैकिंग नेटवर्क से जुड़ने में असमर्थ। इंटरनेट जाँचें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-4 relative shadow-2xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-cyan-400">
          <Package className="w-5 h-5" /> लाइव पार्सल ट्रैकिंग
        </h2>

        {/* Camera & Gallery */}
        <div className="mb-3 p-3 rounded-2xl bg-neutral-900/60 border border-white/5">
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

        {/* Tracking Form */}
        <form onSubmit={handleTrack} className="space-y-2 mb-3">
          <div>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => {
                setTrackingNumber(e.target.value);
                setErrorMsg('');
              }}
              placeholder="कंसाइनमेंट नंबर दर्ज करें"
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500 font-mono tracking-wider"
            />
            {errorMsg && (
              <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> लाइव जाँच हो रही है...</> : 'लाइव स्थिति देखें'}
          </button>
        </form>

        {/* Real Live Result & Checkpoints */}
        {courierResult && (
          <div className="mt-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-300">{courierResult.carrier}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  courierResult.isDelivered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                {courierResult.statusText}
              </span>
            </div>

            {/* Route Summary */}
            <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
              <div>
                <p className="text-neutral-400 text-[10px]">कहाँ से</p>
                <p className="font-semibold text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" /> {courierResult.origin}
                </p>
              </div>
              <span className="text-neutral-500 font-bold">➔</span>
              <div>
                <p className="text-neutral-400 text-[10px]">कहाँ पहुँचना है</p>
                <p className="font-semibold text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {courierResult.destination}
                </p>
              </div>
            </div>

            {/* Step-by-Step Travel Checkpoints */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              <p className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> पार्सल का सफ़र (टाइमलाइन):
              </p>
              <div className="space-y-2.5 pl-2 border-l-2 border-cyan-500/30 ml-1">
                {courierResult.checkpoints.map((cp: any, idx: number) => (
                  <div key={idx} className="relative pl-3">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-neutral-950" />
                    <p className="text-[11px] font-semibold text-white">{cp.title}</p>
                    <p className="text-[10px] text-neutral-300">{cp.desc}</p>
                    <p className="text-[9px] text-neutral-500 font-mono mt-0.5">{cp.date} • {cp.location}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Official Link */}
            {courierResult.officialUrl && (
              <a
                href={courierResult.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition border border-cyan-500/20"
              >
                आधिकारिक कूरियर पोर्टल पर पुष्टि करें <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <p className="text-[10px] text-neutral-400 pt-1 border-t border-white/5 text-right font-mono">
              कंसाइनमेंट: {courierResult.trackingId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
              }
