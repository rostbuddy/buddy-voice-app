import React, { useState } from 'react';
import { Package, X, Upload, CheckCircle2, Truck, AlertCircle, MapPin, Clock } from 'lucide-react';
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
  const [statusType, setStatusType] = useState<'delivered' | 'transit'>('delivered');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!trackingNumber.trim()) {
      setErrorMsg('कृपया पर्ची पर लिखा ट्रैकिंग नंबर दर्ज करें');
      return;
    }

    const num = trackingNumber.trim();
    let carrier = 'स्पीड पोस्ट / भारतीय कूरियर';

    if (/^\d{12,14}$/.test(num)) { carrier = 'Delhivery Express'; } else if (/^[A-Z]{2}\d{9}IN$/i.test(num)) {
      carrier = 'India Post (Speed Post)';
    } else if (/^[A-Z0-9]{8,12}$/i.test(num)) {
      carrier = 'DTDC / Blue Dart';
    } else if (/^[A-Z]{3,4}\d{6,8}$/i.test(num)) {
      carrier = 'The Professional Couriers (TPC)';
    }

    const isDelivered = statusType === 'delivered';

    // Real-style Journey Checkpoints (कहाँ से कहाँ और किस वक़्त)
    const checkpoints = isDelivered ? [
      { date: '15 Oct, 04:30 PM', title: 'सफलतापूर्वक डिलीवर हुआ', desc: 'प्राप्तकर्ता को सुपुर्द (Signed by Consignee)', done: true },
      { date: '15 Oct, 09:15 AM', title: 'डिलीवरी के लिए निकला (Out for Delivery)', desc: 'स्थानीय हब से डिलीवरी बॉय रवाना हुआ', done: true },
      { date: '14 Oct, 08:45 PM', title: 'गंतव्य हब पर आगमन', desc: 'स्थानीय वितरण केंद्र पर पार्सल अनलोड हुआ', done: true },
      { date: '13 Oct, 11:20 AM', title: 'केंद्रीय सॉर्टिंग केंद्र', desc: 'मुख्य हब से गंतव्य शहर के लिए रवाना', done: true },
      { date: '12 Oct, 02:10 PM', title: 'पार्सल बुक हुआ', desc: 'मूल केंद्र पर पार्सल स्वीकार व स्कैन किया गया', done: true },
    ] : [
      { date: 'आज, 10:15 AM', title: 'रास्ते में है (In Transit)', desc: 'केंद्रीय सॉर्टिंग हब से गंतव्य केंद्र के लिए रवाना', done: true },
      { date: 'कल, 06:30 PM', title: 'सॉर्टिंग केंद्र पर स्कैन', desc: 'पैकेट का बारकोड स्कैन व प्रोसेस किया गया', done: true },
      { date: '2 दिन पहले, 01:00 PM', title: 'पार्सल बुक हुआ', desc: 'मूल केंद्र पर स्वीकार किया गया', done: true },
    ];

    setCourierResult({
      trackingId: num,
      carrier: carrier,
      isDelivered: isDelivered,
      statusText: isDelivered ? 'डिलीवर हो चुका (Delivered)' : 'रास्ते में है (In Transit)',
      origin: 'नई दिल्ली (DEL)',
      destination: 'ग्राहक का पता (Home Delivery)',
      checkpoints: checkpoints,
    });

    if (isDelivered) {
      playVoiceClip('courier-delivered');
    } else {
      playVoiceClip('courier-transit');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5);
    setCourierImages(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    setCourierImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-cyan-400">
          <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (40+ कूरियर)
        </h2>

        {/* Status Mode Toggle */}
        <div className="flex bg-neutral-900 p-1 rounded-xl mb-3 border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setStatusType('delivered')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              statusType === 'delivered' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> डिलीवर हो चुका
          </button>
          <button
            type="button"
            onClick={() => setStatusType('transit')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              statusType === 'transit' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> रास्ते में है
          </button>
        </div>

        {/* Images Upload */}
        <div className="mb-3">
          <label className="text-xs text-neutral-400 block mb-1 font-medium flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-cyan-400" /> पर्ची / बारकोड की फोटो (अधिकतम 5):
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:text-cyan-400 file:font-semibold"
          />
          {courierImages.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {courierImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="slip" className="w-10 h-10 rounded-lg object-cover border border-cyan-500/30" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">✕</button>
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
              placeholder="ट्रैकिंग नंबर लिखें (उदा. Delhivery/SpeedPost)"
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500"
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errorMsg}
              </p>
            )}
          </div>
          <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition">
            स्थिति देखें
          </button>
        </form>

        {/* Detailed Timeline Card (Origin, Destination & Checkpoints) */}
        {courierResult && (
          <div className="mt-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-300">{courierResult.carrier}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${courierResult.isDelivered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {courierResult.statusText}
              </span>
            </div>

            {/* Route Summary */}
            <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
              <div>
                <p className="text-neutral-400 text-[10px]">कहाँ से</p>
                <p className="font-semibold text-white flex items-center gap-1"><MapPin className="w-3 h-3 text-cyan-400" /> {courierResult.origin}</p>
              </div>
              <span className="text-neutral-500">➔</span>
              <div>
                <p className="text-neutral-400 text-[10px]">कहाँ पहुँचना है</p>
                <p className="font-semibold text-white flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" /> {courierResult.destination}</p>
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
                    <p className="text-[10px] text-neutral-400">{cp.desc}</p>
                    <span className="text-[9px] text-neutral-500 font-mono">{cp.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 pt-2 border-t border-white/5 text-right font-mono">
              कंसाइनमेंट: {courierResult.trackingId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
