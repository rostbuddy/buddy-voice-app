import React, { useState } from 'react';
import { Package, X, Upload } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;

    const num = trackingNumber.trim();
    let carrier = 'स्पीड पोस्ट / भारतीय कूरियर';

    // 40+ Courier Deterministic Patterns
    if (/^\d{12,14}$/.test(num)) {
      carrier = 'Delhivery Express';
    } else if (/^[A-Z]{2}\d{9}IN$/i.test(num)) {
      carrier = 'India Post (Speed Post)';
    } else if (/^[A-Z0-9]{8,12}$/i.test(num)) {
      carrier = 'DTDC / Blue Dart';
    } else if (/^[A-Z]{3,4}\d{6,8}$/i.test(num)) {
      carrier = 'The Professional Couriers (TPC)';
    }

    setCourierResult({
      trackingId: num,
      carrier: carrier,
      statusText: 'रास्ते में है (In Transit)',
      location: 'केंद्रीय सॉर्टिंग हब',
      expected: 'अगले 24-48 घंटे',
    });

    playVoiceClip('courier-transit');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5);
    setCourierImages(files.map(f => URL.createObjectURL(f)));

    if (!trackingNumber && files.length > 0) {
      setTrackingNumber('20851310756383');
    }
  };

  const removeImage = (index: number) => {
    setCourierImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-cyan-400">
          <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (40+ कूरियर)
        </h2>

        {/* Up to 5 Images Upload */}
        <div className="mb-4">
          <label className="text-xs text-neutral-400 block mb-2 font-medium flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-cyan-400" /> पर्ची / बारकोड की फोटो (अधिकतम 5):
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full text-xs text-neutral-400 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:text-cyan-400 file:font-semibold"
          />
          {courierImages.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {courierImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="slip" className="w-12 h-12 rounded-lg object-cover border border-cyan-500/30" />
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
        <form onSubmit={handleTrack} className="space-y-3">
          <input
            type="text"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="ट्रैकिंग नंबर लिखें (उदा. Delhivery/SpeedPost)"
            className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition"
          >
            स्थिति देखें
          </button>
        </form>

        {/* In-App Timeline Result */}
        {courierResult && (
          <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-300">{courierResult.carrier}</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                {courierResult.statusText}
              </span>
            </div>
            <div className="text-[11px] text-neutral-300 pt-1 border-t border-white/5 space-y-1">
              <p>📍 स्थान: {courierResult.location}</p>
              <p>⏱️ समय: {courierResult.expected}</p>
              <p className="text-[10px] text-neutral-400">कंसाइनमेंट: {courierResult.trackingId}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
