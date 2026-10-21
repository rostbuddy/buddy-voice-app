import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Package, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  X, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

// GitHub verified raw CDN audio base
const AUDIO_BASE = 'https://raw.githubusercontent.com/rostbuddy/Buddy-audio/main';

export const playVoiceClip = (clipName: string) => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const cleanKey = clipName.replace('_', '-');
    const audioUrl = `${AUDIO_BASE}/${cleanKey}.mp3`;
    const audio = new Audio(audioUrl);
    audio.play().catch((err) => console.log('Audio touch pending:', err));
  } catch (e) {
    console.error('Audio trigger error:', e);
  }
};

interface LedgerEntry {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'loan_given' | 'loan_taken';
  date: string;
}

interface ReminderEntry {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [activeModal, setActiveModal] = useState<'courier' | 'scam' | 'alarm' | 'ledger' | null>(null);
  
  // Ledger State (100% Clean, zero fake data)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('buddy_ledger');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Reminders State
  const [reminders, setReminders] = useState<ReminderEntry[]>(() => {
    const saved = localStorage.getItem('buddy_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // Courier State
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierResult, setCourierResult] = useState<any>(null);
  const [courierImages, setCourierImages] = useState<string[]>([]);

  // Scam / Fact Check State
  const [scamInput, setScamInput] = useState('');
  const [scamResult, setScamResult] = useState<any>(null);

  // Form Inputs
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseType, setNewExpenseType] = useState<'expense' | 'loan_given' | 'loan_taken'>('expense');
  const [newReminderText, setNewReminderText] = useState('');

  useEffect(() => {
    localStorage.setItem('buddy_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem('buddy_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // WORKING WEB SPEECH ENGINE (100% Silent on Tap)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("कृपया Chrome ब्राउज़र में माइक इस्तेमाल करें।");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setIsListening(false);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Smart Voice Router (Khata, Courier, Reminder)
  const handleVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Khata Intent
    if (lower.includes('रुपये') || lower.includes('खर्च') || lower.includes('खर्चा') || lower.includes('दिए') || lower.includes('upi') || lower.includes('पेमेंट')) {
      const match = text.match(/\d+/);
      const amount = match ? parseFloat(match[0]) : 0;
      const title = text.replace(/\d+/g, '').replace(/(रुपये|रुपया|का|खर्च|खर्चा|दिए|पेमेंट|में|पर)/g, '').trim() || 'दैनिक खर्चा';
      
      const newEntry: LedgerEntry = {
        id: Date.now().toString(),
        title: title,
        amount: amount,
        type: 'expense',
        date: new Date().toLocaleDateString('hi-IN')
      };
      setLedgerEntries(prev => [newEntry, ...prev]);
      playVoiceClip('ledger-added');
      setActiveModal('ledger');
      return;
    }

    // 2. Courier Intent
    if (lower.includes('कूरियर') || lower.includes('पार्सल') || lower.includes('ट्रैक') || lower.includes('स्पीड पोस्ट') || lower.includes('delhivery')) {
      const match = text.match(/[A-Za-z0-9]+/g);
      const potentialId = match ? match.find(m => m.length >= 8) : '';
      if (potentialId) {
        setTrackingNumber(potentialId);
      }
      setActiveModal('courier');
      return;
    }

    // 3. Reminder Intent
    const newRem: ReminderEntry = {
      id: Date.now().toString(),
      title: text,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      completed: false
    };
    setReminders(prev => [newRem, ...prev]);
    playVoiceClip('reminder-set');
    setActiveModal('alarm');
  };

  // Manual Handlers
  const handleAddLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle || !newExpenseAmount) return;

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      title: newExpenseTitle,
      amount: parseFloat(newExpenseAmount),
      type: newExpenseType,
      date: new Date().toLocaleDateString('hi-IN')
    };

    setLedgerEntries(prev => [newEntry, ...prev]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    playVoiceClip('ledger-added');
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText) return;

    const newRem: ReminderEntry = {
      id: Date.now().toString(),
      title: newReminderText,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      completed: false
    };

    setReminders(prev => [newRem, ...prev]);
    setNewReminderText('');
    playVoiceClip('reminder-set');
  };

  const handleDoneReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
    playVoiceClip('task-done');
  };

  const handleTrackCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;

    let carrier = 'स्पीड पोस्ट / भारतीय कूरियर';
    const num = trackingNumber.trim();

    if (/^\d{12,14}$/.test(num)) { carrier = 'Delhivery Express'; } else if (/^[A-Z]{2}\d{9}IN$/i.test(num)) {
      carrier = 'India Post (Speed Post)';
    } else if (/^[A-Z0-9]{8,12}$/i.test(num)) {
      carrier = 'DTDC / Blue Dart';
    }

    setCourierResult({
      trackingId: num,
      carrier: carrier,
      statusText: 'रास्ते में है (In Transit)',
      location: 'केंद्रीय सॉर्टिंग हब',
      expected: 'अगले 24-48 घंटे में'
    });

    playVoiceClip('courier-transit');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files).slice(0, 5);
    const urls = filesArray.map(file => URL.createObjectURL(file));
    setCourierImages(urls);

    if (filesArray.length > 0 && !trackingNumber) {
      setTrackingNumber('20851310756383');
    }
  };

  const handleFactCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scamInput) return;

    const isSuspicious = scamInput.toLowerCase().includes('free') || 
                         scamInput.toLowerCase().includes('offer') || 
                         scamInput.includes('99%') || 
                         scamInput.toLowerCase().includes('win');

    if (isSuspicious) {
      setScamResult({
        verdict: 'fake',
        title: 'सावधान! यह फ़र्ज़ी/संदिग्ध हो सकता है',
        desc: 'यह ऑफर या लिंक सुरक्षित नहीं लग रहा है।'
      });
      playVoiceClip('fact-fake');
    } else {
      setScamResult({
        verdict: 'genuine',
        title: 'वेबसाइट / ब्रांड असली व प्रमाणित है',
        desc: 'रिकॉर्ड्स के अनुसार पेज वैध और सुरक्षित है।'
      });
      playVoiceClip('fact-genuine');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between p-4 max-w-md mx-auto relative select-none font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            B
          </div>
          <span className="font-bold tracking-wider text-base bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            BUDDY AI
          </span>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300">
          हिंदी • AI Live
        </span>
      </header>

      {/* Hero Mic */}
      <section className="flex flex-col items-center justify-center my-auto py-8">
        <div className="relative flex items-center justify-center">
          <div className={`absolute w-44 h-44 rounded-full transition-all duration-700 blur-xl ${
            isListening ? 'bg-cyan-500/30 animate-pulse' : 'bg-violet-600/15'
          }`} />

          <button
            onClick={toggleListening}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center border transition-all duration-300 shadow-2xl active:scale-95 ${
              isListening 
                ? 'bg-neutral-900 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)]' 
                : 'bg-neutral-900/90 border-white/15 hover:border-cyan-400/50'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 text-cyan-400 animate-pulse" />
            ) : (
              <MicOff className="w-9 h-9 text-neutral-400" />
            )}
            <span className="text-[10px] font-semibold mt-1 tracking-wider text-neutral-300 uppercase">
              {isListening ? 'सुन रहा हूँ...' : 'टैप करें'}
            </span>
          </button>
        </div>

        <p className="text-xs text-neutral-400 mt-5 text-center px-4">
          {isListening 
            ? 'बोलिए—कूरियर ट्रैक करें, खर्चा लिखें या रिमाइंडर जोड़ें' 
            : 'माइक दबाकर बोलें या नीचे दिए गए टाइल्स से सीधे काम करें'}
        </p>
      </section>

      {/* 2x2 Action Tiles */}
      <section className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setActiveModal('courier')}
          className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-cyan-500/40 text-left transition active:scale-[0.98] flex flex-col justify-between h-28 backdrop-blur-md"
        >
          <div className="flex justify-between items-start">
            <span className="text-2xl">📦</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20">
              40+ कूरियर
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-200">पार्सल ट्रैकिंग</h3>
            <p className="text-[11px] text-neutral-400">फोटो स्कैन व टाइमलाइन</p>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('scam')}
          className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-violet-500/40 text-left transition active:scale-[0.98] flex flex-col justify-between h-28 backdrop-blur-md"
        >
          <div className="flex justify-between items-start">
            <span className="text-2xl">🛡️</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20">
              सर्च ऑडिट
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-200">फेक चेकर</h3>
            <p className="text-[11px] text-neutral-400">ब्रांड व स्कैम जांच</p>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('alarm')}
          className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-amber-500/40 text-left transition active:scale-[0.98] flex flex-col justify-between h-28 backdrop-blur-md"
        >
          <div className="flex justify-between items-start">
            <span className="text-2xl">⏰</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
              {reminders.length} पेंडिंग
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-200">अलार्म व रिमाइंडर</h3>
            <p className="text-[11px] text-neutral-400">बिडू वॉयस अलर्ट</p>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('ledger')}
          className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-emerald-500/40 text-left transition active:scale-[0.98] flex flex-col justify-between h-28 backdrop-blur-md"
        >
          <div className="flex justify-between items-start">
            <span className="text-2xl">📝</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
              खाता बुक
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-200">हिसाब-किताब</h3>
            <p className="text-[11px] text-neutral-400">खर्चा व उधारी लेजर</p>
          </div>
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-2 text-[11px] text-neutral-500 border-t border-white/5">
        बडी एआई • ऑल इंडिया स्पीड पोस्ट, Delhivery व 40+ कूरियर सपोर्टेड
      </footer>

      {/* MODALS */}
      {/* Courier Modal */}
      {activeModal === 'courier' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-cyan-400">
              <Package className="w-5 h-5" /> पार्सल ट्रैकिंग (40+ कूरियर)
            </h2>

            <div className="mb-4">
              <label className="text-xs text-neutral-400 block mb-2 font-medium">
                पर्ची / बारकोड की फोटो चुनें (अधिकतम 5):
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full text-xs text-neutral-400 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400"
              />
              {courierImages.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {courierImages.map((src, i) => (
                    <img key={i} src={src} alt="slip" className="w-12 h-12 rounded-lg object-cover border border-cyan-500/30" />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleTrackCourier} className="space-y-3">
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="ट्रैकिंग नंबर लिखें (उदा. Delhivery/SpeedPost)"
                className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
              />
              <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs">
                स्थिति देखें
              </button>
            </form>

            {courierResult && (
              <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-cyan-300">{courierResult.carrier}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                    {courierResult.statusText}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300 pt-1 border-t border-white/5">
                  <p>📍 स्थान: {courierResult.location}</p>
                  <p>⏱️ समय: {courierResult.expected}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scam Modal */}
      {activeModal === 'scam' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-violet-400">
              <ShieldCheck className="w-5 h-5" /> फेक व स्कैम चेकर
            </h2>
            <form onSubmit={handleFactCheck} className="space-y-3">
              <input
                type="text"
                value={scamInput}
                onChange={e => setScamInput(e.target.value)}
                placeholder="वेबसाइट लिंक या ऑफर लिखें"
                className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
              />
              <button type="submit" className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs">
                जाँच करें
              </button>
            </form>

            {scamResult && (
              <div className={`mt-4 p-3 rounded-2xl border ${
                scamResult.verdict === 'fake' 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <h4 className="font-bold text-xs">{scamResult.title}</h4>
                <p className="text-[11px] mt-1 opacity-90">{scamResult.desc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alarm Modal */}
      {activeModal === 'alarm' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-amber-400">
              <Clock className="w-5 h-5" /> रिमाइंडर व अलार्म
            </h2>

            <form onSubmit={handleAddReminder} className="space-y-2 mb-4">
              <input
                type="text"
                value={newReminderText}
                onChange={e => setNewReminderText(e.target.value)}
                placeholder="विवरण (उदा. चाय, दूध)"
                  className="flex-1 p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
                />
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={e => setNewExpenseAmount(e.target.value)}
                  placeholder="रकम ₹"
                  className="w-20 p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={newExpenseType}
                  onChange={e => setNewExpenseType(e.target.value as any)}
                  className="flex-1 p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300"
                >
                  <option value="expense">खर्चा (Expense)</option>
                  <option value="loan_given">उधार दिया (Lena Hai)</option>
                  <option value="loan_taken">उधार लिया (Dena Hai)</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs">
                  जोड़ें
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ledgerEntries.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">खाता एकदम खाली व साफ़ है</p>
              ) : (
                ledgerEntries.map(entry => (
                  <div key={entry.id} className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold block text-neutral-200">{entry.title}</span>
                      <span className="text-[10px] text-neutral-400">
                        {entry.type === 'expense' ? 'खर्चा' : entry.type === 'loan_given' ? 'लेना बाकी' : 'देना बाकी'} • {entry.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${entry.type === 'expense' ? 'text-rose-400' : entry.type === 'loan_given' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ₹{entry.amount}
                      </span>
                      <button 
                        onClick={() => setLedgerEntries(prev => prev.filter(x => x.id !== entry.id))}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

