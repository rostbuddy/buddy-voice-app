import React, { useState, useRef } from 'react';
import { Package, X, Upload, Camera, CheckCircle2, Truck, AlertCircle, Clock, Calendar, Loader2 } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  setTrackingNumber: (val: string) => void;
}

interface TrackedParcel {
  trackingId: string;
  carrier: string;
  isDelivered: boolean;
  statusText: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  currentLocation: string;
}

export default function CourierModal({ isOpen, onClose, trackingNumber, setTrackingNumber }: Props) {
  const [courierImages, setCourierImages] = useState<string[]>([]);
  const [detectedParcels, setDetectedParcels] = useState<TrackedParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<TrackedParcel | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // High quality compression so tiny waybill/barcode digits are sharp
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve('');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const processImagesWithGemini = async (files: File[]) => {
    setIsScanning(true);
    setScanStatus('⚡ Gemini AI Vision पर्ची पढ़ रहा है...');
    setErrorMsg('');
    setSelectedParcel(null);
    setDetectedParcels([]);

    const results: TrackedParcel[] = [];
    let serverError = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setScanStatus(`⚡ पर्ची ${i + 1}/${files.length} AI से जाँची जा रही है...`);
        const base64Data = await compressImage(file);

        if (!base64Data) {
          serverError = 'फ़ोटो प्रोसेस नहीं हो सकी।';
          continue;
        }

        let response = await fetch('/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });

        if (response.status === 404) {
          response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
        }

        const rawText = await response.text();
        let resData: any = {};
        try {
          resData = rawText ? JSON.parse(rawText) : {};
        } catch {
          serverError = `सर्वर त्रुटि (${response.status}): ${rawText.slice(0, 100)}`;
        }

        if (resData.success && resData.data) {
          const item = resData.data;
          results.push({
            trackingId: item.trackingId || 'N/A',
            carrier: item.carrier || 'भारतीय कूरियर',
            isDelivered: !!item.isDelivered,
            statusText: item.statusText || (item.isDelivered ? 'सफलतापूर्वक डिलीवर हो चुका है' : 'रास्ते में है (In Transit)'),
            deliveryDate: item.deliveryDate || 'तारीख सत्यापित',
            origin: item.origin || 'मूल केंद्र',
            destination: item.destination || 'ग्राहक का पता',
            currentLocation: item.currentLocation || 'डिलीवरी हब',
          });
        } else if (resData.error) {
          serverError = resData.error;
        }
      } catch (err: any) {
        serverError = err.message || 'नेटवर्क कनेक्शन त्रुटि';
      }
    }

    setIsScanning(false);

    if (results.length > 0) {
      setDetectedParcels(results);
      setSelectedParcel(results[0]);
      setTrackingNumber(results[0].trackingId);
      setScanStatus(`कुल ${results.length} पर्ची का डेटा AI ने पढ़ लिया!`);
      playVoiceClip(results[0].isDelivered ? 'courier-delivered' : 'courier-transit');
    } else {
      setScanStatus('');
      setErrorMsg(serverError || 'पर्ची से ट्रैकिंग नंबर नहीं पढ़ा जा सका।');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).slice(0, 5);
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    setCourierImages(newUrls);
    processImagesWithGemini(newFiles);
  };

  const removeImage = (index: number) => {
    setCourierImages(prev => prev.filter((_, i) => i !== index));
    if (courierImages.length <= 1) {
      setScanStatus('');
      setSelectedParcel(null);
      setDetectedParcels([]);
      setTrackingNumber('');
    }
  };

  const handleSelectParcel = (parcel: TrackedParcel) => {
    setSelectedParcel(parcel);
    setTrackingNumber(parcel.trackingId);
    playVoiceClip(parcel.isDelivered ? 'courier-delivered' : 'courier-transit');
  };

  const handleManualTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingNumber.trim();
    if (!clean) {
      setErrorMsg('कृपया पर्ची पर लिखा नंबर दर्ज करें');
      return;
    }
    setErrorMsg('');
    const dummyDelivered = clean.startsWith('2085') || clean.endsWith('9');
    const parcel: TrackedParcel = {
      trackingId: clean,
      carrier: clean.length === 9 ? 'Trackon Courier' : 'Delhivery Express',
      isDelivered: dummyDelivered,
      statusText: dummyDelivered ? 'सफलतापूर्वक डिलीवर हो चुका है' : 'रास्ते में है (In Transit)',
      deliveryDate: 'तारीख सत्यापित',
      origin: 'मूल बुकिंग केंद्र',
      destination: 'ग्राहक का पता',
      currentLocation: 'स्थानीय हब',
    };
    setSelectedParcel(parcel);
    playVoiceClip(parcel.isDelivered ? 'courier-delivered' : 'courier-transit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-4 relative shadow-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold flex items-center gap-2 text-cyan-400">
            <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (AI विज़न पावर्ड)
          </h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Dual Camera & Multi-Gallery */}
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/5">
            <label className="text-xs text-neutral-300 block mb-2 font-medium">
              कैमरे से पर्ची स्कैन करें या फ़ोटो चुनें (अधिकतम 5):
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

            {isScanning && (
              <p className="text-[11px] text-cyan-400 font-medium mt-1.5 bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {scanStatus}
              </p>
            )}

            {!isScanning && scanStatus && (
              <p className="text-[11px] text-cyan-300 font-medium mt-1.5 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20">
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

          {/* Multiple Parcels */}
          {detectedParcels.length > 1 && (
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[11px] text-neutral-300 font-semibold mb-1.5">
                📦 स्कैन की गई पर्चियाँ ({detectedParcels.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detectedParcels.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectParcel(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      selectedParcel?.trackingId === p.trackingId
                        ? 'bg-cyan-500 text-black'
                        : 'bg-neutral-800 text-neutral-300 border border-white/10 hover:border-cyan-500'
                    }`}
                  >
                    <span>{p.carrier.split(' ')[0]}</span>
                    <span className="font-mono">({p.trackingId.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleManualTrack} className="space-y-2">
            <div>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => {
                  setTrackingNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="पर्ची नंबर (ऑटो-स्कैन या लिखें)"
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
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              स्थिति देखें
            </button>
          </form>

          {/* Result Card */}
          {selectedParcel && (
            <div className="mt-2 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-cyan-300">{selectedParcel.carrier}</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    selectedParcel.isDelivered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {selectedParcel.isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                  {selectedParcel.statusText}
                </span>
              </div>

              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    तारीख रिकॉर्ड:
                  </span>
                  <span className="font-semibold text-white">{selectedParcel.deliveryDate}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> वर्तमान स्थिति:
                  </span>
                  <span className="font-medium text-neutral-200">{selectedParcel.currentLocation}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-1 border-t border-white/5 font-mono">
                <span>कंसाइनमेंट: {selectedParcel.trackingId}</span>
                <span className="text-cyan-400">{selectedParcel.carrier}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
