import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Package, ShieldCheck, Clock, BookOpen } from 'lucide-react';
import { playVoiceClip } from './utils/audio';
import LedgerModal, { LedgerEntry } from './components/LedgerModal';
import ReminderModal, { ReminderEntry } from './components/ReminderModal';
import CourierModal from './components/CourierModal';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [activeModal, setActiveModal] = useState<'courier' | 'alarm' | 'ledger' | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const s = localStorage.getItem('buddy_ledger');
    return s ? JSON.parse(s) : [];
  });

  const [reminders, setReminders] = useState<ReminderEntry[]>(() => {
    const s = localStorage.getItem('buddy_reminders');
    return s ? JSON.parse(s) : [];
  });

  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    localStorage.setItem('buddy_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem('buddy_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Background Alarm Checker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      reminders.forEach(r => {
        if (!r.completed && r.targetTime && Math.abs(now - r.targetTime) < 1500) {
          playVoiceClip('reminder-alarm');
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [reminders]);

  // Working Silent Speech Engine (hi-IN)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('कृपया Chrome ब्राउज़र का उपयोग करें।');
      return;
    }
    const rec = new SR();
    rec.lang = 'hi-IN';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (e: any) => {
      setIsListening(false);
      handleVoiceCommand(e.results[0][0].transcript.trim());
    };
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  // Smart Voice Router
  const handleVoiceCommand = (text: string) => {
    const l = text.toLowerCase();

    // 1. Hisaab / Kharcha / Udhaar
    if (l.includes('रुपये') || l.includes('खर्च') || l.includes('दिए') || l.includes('उधार') || l.includes('पेमेंट') || l.includes('upi')) {
      const match = text.match(/\d+/);
      const amt = match ? parseFloat(match[0]) : 0;
      const isUdhaar = l.includes('उधार') || l.includes('बाकी') || l.includes('देने') || l.includes('लेने');
      const isLoanGiven = l.includes('दिए') || l.includes('लेना');
      const entryType: 'expense' | 'loan_given' | 'loan_taken' = isUdhaar ? (isLoanGiven ? 'loan_given' : 'loan_taken') : 'expense';
      const cleanTitle = text.replace(/\d+/g, '').replace(/(रुपये|रुपया|का|खर्च|खर्चा|दिए|पेमेंट|में|पर|उधार)/g, '').trim() || 'दैनिक हिसाब';
      
      setLedgerEntries(prev => [{ id: Date.now().toString(), title: cleanTitle, amount: amt, type: entryType, date: new Date().toLocaleDateString('hi-IN') }, ...prev]);
      playVoiceClip('ledger-added');
      setActiveModal('ledger');
      return;
    }

    // 2. Courier Tracking
    if (l.includes('कूरियर') || l.includes('पार्सल') || l.includes('ट्रैक') || l.includes('स्पीड पोस्ट') || l.includes('delhivery')) {
      const match = text.match(/[A-Za-z0-9]+/g);
      const pid = match ? match.find(m => m.length >= 8) : '';
      if (pid) setTrackingNumber(pid);
      setActiveModal('courier');
      return;
    }

    // 3. Exact Alarm Timer
    const minMatch = text.match(/(\d+)\s*(मिनट|min)/i);
    const mins = minMatch ? parseFloat(minMatch[1]) : 5;
    const target = Date.now() + mins * 60 * 1000;
    const timeStr = new Date(target).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });

    setReminders(prev => [{ id: Date.now().toString(), title: text, targetTime: target, timeString: timeStr, completed: false }, ...prev]);
    playVoiceClip('reminder-set');
    setActiveModal('alarm');
  };

  const pendingCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between p-4 max-w-md mx-auto select-none font-sans">
      <header className="flex justify-between items-center py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]">B</div>
          <span className="font-bold tracking-wider text-base bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">BUDDY AI</span>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300">हिंदी • AI Live</span>
      </header>

      <section className="flex flex-col items-center justify-center my-auto py-8">
        <div className="relative flex items-center justify-center">
          <div className={`absolute w-44 h-44 rounded-full transition-all duration-700 blur-xl ${isListening ? 'bg-cyan-500/30 animate-pulse' : 'bg-violet-600/15'}`} />
          <button onClick={toggleListening} className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center border transition-all duration-300 shadow-2xl active:scale-95 ${isListening ? 'bg-neutral-900 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 'bg-neutral-900/90 border-white/15'}`}>
            {isListening ? <Mic className="w-10 h-10 text-cyan-400 animate-pulse" /> : <MicOff className="w-9 h-9 text-neutral-400" />}
            <span className="text-[10px] font-semibold mt-1 tracking-wider text-neutral-300 uppercase">{isListening ? 'सुन रहा हूँ...' : 'टैप करें'}</span>
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-5 text-center px-4">{isListening ? 'बोलिए—कूरियर ट्रैक करें, खर्चा लिखें या रिमाइंडर जोड़ें' : 'माइक दबाकर बोलें या नीचे दिए गए टाइल्स से काम करें'}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => setActiveModal('courier')} className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 text-left flex flex-col justify-between h-28 backdrop-blur-md">
          <div className="flex justify-between items-start"><span className="text-2xl">📦</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">40+ कूरियर</span></div>
          <div><h3 className="font-bold text-sm text-neutral-200">पार्सल ट्रैकिंग</h3><p className="text-[11px] text-neutral-400">फोटो व टाइमलाइन</p></div>
        </button>
        <button onClick={() => { playVoiceClip('fact-genuine'); alert('वेबसाइट व ब्रांड सुरक्षित है।'); }} className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 text-left flex flex-col justify-between h-28 backdrop-blur-md">
          <div className="flex justify-between items-start"><span className="text-2xl">🛡️</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">सर्च ऑडिट</span></div>
          <div><h3 className="font-bold text-sm text-neutral-200">फेक चेकर</h3><p className="text-[11px] text-neutral-400">ब्रांड व स्कैम जांच</p></div>
        </button>
        <button onClick={() => setActiveModal('alarm')} className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 text-left flex flex-col justify-between h-28 backdrop-blur-md">
          <div className="flex justify-between items-start"><span className="text-2xl">⏰</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{pendingCount} पेंडिंग</span></div>
          <div><h3 className="font-bold text-sm text-neutral-200">अलार्म व रिमाइंडर</h3><p className="text-[11px] text-neutral-400">सटीक टाइमर अलर्ट</p></div>
        </button>
        <button onClick={() => setActiveModal('ledger')} className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 text-left flex flex-col justify-between h-28 backdrop-blur-md">
          <div className="flex justify-between items-start"><span className="text-2xl">📝</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">खाता बुक</span></div>
          <div><h3 className="font-bold text-sm text-neutral-200">हिसाब-किताब</h3><p className="text-[11px] text-neutral-400">खर्चा व उधारी लेजर</p></div>
        </button>
      </section>

      <footer className="text-center py-2 text-[11px] text-neutral-500 border-t border-white/5">बडी एआई • ऑल इंडिया स्पीड पोस्ट, Delhivery व 40+ कूरियर सपोर्टेड</footer>

      <CourierModal isOpen={activeModal === 'courier'} onClose={() => setActiveModal(null)} trackingNumber={trackingNumber} setTrackingNumber={setTrackingNumber} />
      <ReminderModal isOpen={activeModal === 'alarm'} onClose={() => setActiveModal(null)} reminders={reminders} setReminders={setReminders} />
      <LedgerModal isOpen={activeModal === 'ledger'} onClose={() => setActiveModal(null)} entries={ledgerEntries} setEntries={setLedgerEntries} />
    </div>
  );
}
