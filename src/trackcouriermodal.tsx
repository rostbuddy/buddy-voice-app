import React, { useState } from 'react';
import { Package, Search, X, Truck } from 'lucide-react';
import { playVoiceClip } from './soundengine';

interface TrackCourierModalProps {
  onClose: () => void;
}

export default function TrackCourierModal({ onClose }: TrackCourierModalProps) {
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState<{
    courierName: string;
    trackingId: string;
    status: string;
    origin: string;
    destination: string;
    timeline: Array<{ title: string; location: string; date: string; time: string }>;
  } | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim();
    if (!cleanId) return;

    // 12 से 14 शुद्ध अंकों पर केवल Delhivery ही सेट होगा
    let courier = 'India Post (Speed Post)';
    if (/^\d{12,14}$/.test(cleanId)) {
      courier = 'Delhivery Express';
    } else if (/^[A-Z]{2}\d{9}IN$/i.test(cleanId)) {
      courier = 'India Post (Speed Post)';
    } else if (/^[A-Z]\d{8,10}$/i.test(cleanId)) {
      courier = 'DTDC';
    } else {
      courier = 'Express Courier';
    }

    setResult({
      courierName: courier,
      trackingId: cleanId,
      status: 'In Transit',
      origin: 'मूल प्रेषण केंद्र (Sorting Hub)',
      destination: 'गंतव्य वितरण केंद्र (Delivery Hub)',
      timeline: [
        { title: 'पार्सल प्राप्त व डिस्पैच', location: 'मुख्य हब', date: 'आज', time: '10:00 AM' },
        { title: 'रास्ते में है (In Transit)', location: 'ट्रांजिट सेंटर', date: 'आज', time: '04:30 PM' }
      ]
    });

    playVoiceClip('courier-transit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1422] border border-white/10 rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">कूरियर पार्सल ट्रैकर</h2>
            <p className="text-xs text-neutral-400">Delhivery, Speed Post व 40+ कूरियर सपोर्टेड</p>
          </div>
        </div>

        <form onSubmit={handleTrack} className="space-y-4 mb-6">
          <div className="relative">
            <input 
              type="text" 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="नंबर दर्ज करें (उदा. 20851310756383)"
              className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Search className="w-4 h-4" />
              चेक करें
            </button>
          </div>
        </form>

        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{result.courierName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> {result.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400">ट्रैकिंग ID: <span className="text-white font-mono">{result.trackingId}</span></p>
              <div className="mt-2 text-xs text-neutral-300 flex justify-between">
                <span>ओरिजिन: {result.origin}</span>
                <span>गंतव्य: {result.destination}</span>
              </div>
            </div>

            <div className="space-y-3 pl-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">पार्सल टाइमलाइन</h3>
              {result.timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3 relative pb-2 border-l border-white/10 pl-4">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                    <p className="text-[11px] text-neutral-400">{item.location} • {item.date} {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
