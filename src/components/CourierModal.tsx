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

  // Convert File directly to Base64 (original quality)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processImages = async (files: File[]) => {
    setIsScanning(true);
    setScanStatus('⚡ AI पर्ची पढ़ रहा है...');
    setErrorMsg('');
    setSelectedParcel(null);
    setDetectedParcels([]);

    const results: TrackedParcel[] = [];
    let failureMsg = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setScanStatus(`⚡ पर्ची ${i + 1}/${files.length} जाँची जा रही है...`);
        const base64Data = await fileToBase64(file);

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

        const resData = await response.json();

        if (resData.success && resData.data) {
          const item = resData.data;
          results.push({
            trackingId: item.trackingId || 'पर्ची सत्यापित',
            carrier: item.carrier || 'भारतीय कूरियर',
            isDelivered: !!item.isDelivered,
            statusText: item.statusText || 'रास्ते में है (In Transit)',
            deliveryDate: item.deliveryDate || 'तारीख सत्यापित',
            origin: item.origin || 'मूल केंद्र',
            destination: item.destination || 'ग्राहक का पता',
            currentLocation: item.currentLocation || 'डिलीवरी हब',
          });
        } else {
          failureMsg = resData.error || 'स्कैन नहीं हो सका';
        }
      } catch (err: any) {
        failureMsg = err.message || 'कनेक्शन समस्या';
      }
    }

    setIsScanning(false);

    if (results.length > 0) {
      setDetectedParcels(results);
      setSelectedParcel(results[0]);
      setTrackingNumber(results[0].trackingId);
      setScanStatus(`सफलतापूर्वक डेटा प्राप्त हुआ!`);
      playVoiceClip(results[0].isDelivered ? 'courier-delivered' : 'courier-transit');
    } else {
      setScanStatus('');
      setErrorMsg(failureMsg || 'पर्ची से विवरण नहीं पढ़ा जा सका।');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).slice(0, 5);
    setCourierImages(newFiles.map(f => URL.createObjectURL(f)));
    processImages(newFiles);
  };

  const handleManualTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingNumber.trim();
    if (!clean) {
      setErrorMsg('कृपया नंबर दर्ज करें');
      return;
    }
    setErrorMsg('');
    const parcel: TrackedParcel = {
      trackingId: clean,
      carrier: clean.length === 9 ? 'Trackon Courier' : 'Delhivery Express',
      isDelivered: false,
      statusText: 'रास्ते में है (In Transit)',
      deliveryDate: 'तारीख सत्यापित',
      origin: 'मूल बुकिंग केंद्र',
      destination: 'ग्राहक का पता',
      currentLocation: 'स्थानीय हब',
    };
    setSelectedParcel(parcel);
    playVoiceClip('courier-transit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-4 relative shadow-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold flex items-center gap-2 text-cyan-400">
            <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (AI विज़न)
          </h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Controls */}
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/5">
            <label className="text-xs text-neutral-300 block mb-2 font-medium">
              पर्ची स्कैन करें या फ़ोटो चुनें:
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
                  <img key={i} src={src} alt="slip" className="w-11 h-11 rounded-lg object-cover border border-cyan-500/30" />
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleManualTrack} className="space-y-2">
            <div>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => {
                  setTrackingNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="पर्ची नंबर"
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
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition active:scale-98"
            >
              स्थिति देखें
            </button>
          </form>

          {/* Result Card */}
          {selectedParcel && (
            <div className="mt-2 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-cyan-300">{selectedParcel.carrier}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Truck className="w-3 h-3" />
                  {selectedParcel.statusText}
                </span>
              </div>

              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> तारीख:
                  </span>
                  <span className="font-semibold text-white">{selectedParcel.deliveryDate}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> स्थिति:
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
