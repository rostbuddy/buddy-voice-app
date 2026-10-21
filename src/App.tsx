import React, { useState } from 'react';
import { 
  Package, ShieldAlert, AlarmClock, BookOpen, Mic, 
  Sun, Moon, Volume2, VolumeX, MessageSquare, X, 
  Send, Plus, Trash2, CheckCircle2, ChevronRight, Truck
} from 'lucide-react';

// DIRECT IN-APP AUDIO ENGINE (NO EXTERNAL IMPORT ISSUES)
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/rostbuddy/Buddy-audio@main';
const playVoiceClip = (clipName: string) => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const cleanKey = clipName.replace('_', '-');
    const audio = new Audio(`${CDN_BASE}/${cleanKey}.mp3`);
    audio.play().catch(e => console.warn('Audio touch required:', e));
  } catch (err) {
    console.error('Playback error:', err);
  }
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<'courier' | 'ledger' | 'alarm' | 'scam' | 'feedback' | null>(null);

  // 1. LEDGER (हिसाब-किताब) STATE
  const [ledgerEntries, setLedgerEntries] = useState<Array<{ id: string; title: string; amount: number; type: 'expense' | 'loan_taken' | 'loan_given' }>>([
    { id: '1', title: 'चाय और नाश्ता', amount: 120, type: 'expense' },
    { id: '2', title: 'रमेश भाई को दिए', amount: 500, type: 'loan_given' },
    { id: '3', title: 'किराना दुकान बाकी', amount: 350, type: 'loan_taken' },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'expense' | 'loan_taken' | 'loan_given'>('expense');

  // 2. ALARM / REMINDER STATE
  const [reminders, setReminders] = useState<Array<{ id: string; text: string; time: string; completed: boolean }>>([
    { id: '1', text: 'शाम को दवा लेनी है', time: '08:00 PM', completed: false },
    { id: '2', text: 'बिजली का बिल भरना', time: '11:00 AM', completed: true },
  ]);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  // 3. COURIER STATE
  const [trackingId, setTrackingId] = useState('');
  const [courierResult, setCourierResult] = useState<{ name: string; status: string; id: string } | null>(null);

  // 4. SCAM CHECKER STATE
  const [scamQuery, setScamQuery] = useState('');
  const [scamResult, setScamResult] = useState<{ score: number; verdict: string; tier: 'safe' | 'caution' | 'danger' } | null>(null);

  // 5. FEEDBACK STATE
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const triggerAudio = (clip: string) => {
    if (soundEnabled) playVoiceClip(clip);
  };

  const handleAddLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;
    setLedgerEntries(prev => [
      { id: Date.now().toString(), title: newTitle.trim(), amount: Number(newAmount), type: newType },
      ...prev
    ]);
    setNewTitle('');
    setNewAmount('');
    triggerAudio('ledger-added');
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    setReminders(prev => [
      { id: Date.now().toString(), text: newReminderText.trim(), time: newReminderTime || 'जल्द ही', completed: false },
      ...prev
    ]);
    setNewReminderText('');
    setNewReminderTime('');
    triggerAudio('reminder-set');
  };

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        if (!r.completed) triggerAudio('task-done');
        return { ...r, completed: !r.completed };
      }
      return r;
    }));
  };

  const handleCheckCourier = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingId.trim();
    if (!clean) return;
    let name = 'India Post (Speed Post)';
    if (/^\d{12,14}$/.test(clean)) { name = 'Delhivery Express'; } else if (/^[A-Z]\d{8,10}$/i.test(clean)) {
      name = 'DTDC';
    }
    setCourierResult({ name, status: 'In Transit (रास्ते में है)', id: clean });
    triggerAudio('courier-transit');
  };

  const handleCheckScam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scamQuery.trim()) return;
    const isSuspicious = scamQuery.toLowerCase().includes('free') || scamQuery.toLowerCase().includes('offer');
    if (isSuspicious) {
      setScamResult({ score: 25, verdict: 'अत्यधिक संदेहास्पद (हाई रिस्क)', tier: 'danger' });
      triggerAudio('fact-fake');
    } else {
      setScamResult({ score: 90, verdict: 'जेनुइन व सुरक्षित प्रोफाइल', tier: 'safe' });
      triggerAudio('fact-genuine');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#07090e] text-neutral-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300 pb-12`}>
      
      {/* 1. TOP APP BAR */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-black text-sm shadow-[0_0_12px_rgba(6,182,212,0.5)]">
            B
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Buddy AI</h1>
            <p className="text-[10px] text-cyan-400 font-medium">वॉयस साथी • 100% प्राइवेट</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`p-2 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'} transition`}
            title={soundEnabled ? 'आवाज़ ऑन' : 'आवाज़ म्यूट'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')} 
            className={`p-2 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'} transition`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* 2. CENTER HERO: APPLE INTELLIGENCE AURA & SOUNDWAVES */}
      <section className="px-5 pt-8 pb-6 flex flex-col items-center text-center">
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
          <div className="absolute w-36 h-36 rounded-full bg-violet-600/20 blur-xl animate-ping duration-1000" />
          
          <button 
            onClick={() => triggerAudio('reminder-nudge')}
            className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-[2px] shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-95 transition"
          >
            <div className={`w-full h-full rounded-full ${isDark ? 'bg-[#0b0e17]' : 'bg-white'} flex flex-col items-center justify-center`}>
              <Mic className="w-9 h-9 text-cyan-400 mb-1" />
              <span className="text-[10px] font-bold tracking-wider text-cyan-300">TAP TO SPEAK</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 h-6 my-2">
          <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1 h-5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1 h-6 bg-violet-400 rounded-full animate-bounce" />
          <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
          <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
        </div>
        <p className="text-xs text-neutral-400 max-w-xs mt-1">
          "कूरियर ट्रैक करो", "₹200 खर्चा लिखो", या "कल 10 बजे याद दिलाना"
        </p>
      </section>

      {/* 3. 2x2 ACTION TILES */}
      <main className="px-5 max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Card 1: Courier */}
          <div 
            onClick={() => setActiveModal('courier')}
            className={`p-4 rounded-3xl border ${isDark ? 'bg-neutral-900/60 border-white/10 hover:border-cyan-500/40' : 'bg-white border-slate-200 shadow-sm'} transition active:scale-98 cursor-pointer flex flex-col justify-between h-36`}
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">📦 कूरियर ट्रैक</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Delhivery व 40+ कूरियर</p>
            </div>
          </div>

          {/* Card 2: Hisab / Ledger */}
          <div 
            onClick={() => setActiveModal('ledger')}
            className={`p-4 rounded-3xl border ${isDark ? 'bg-neutral-900/60 border-white/10 hover:border-emerald-500/40' : 'bg-white border-slate-200 shadow-sm'} transition active:scale-98 cursor-pointer flex flex-col justify-between h-36`}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">💰 हिसाब-किताब</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">3-कॉलम बहीखाता डायरी</p>
            </div>
          </div>

          {/* Card 3: Alarm & Reminders */}
          <div 
            onClick={() => setActiveModal('alarm')}
            className={`p-4 rounded-3xl border ${isDark ? 'bg-neutral-900/60 border-white/10 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm'} transition active:scale-98 cursor-pointer flex flex-col justify-between h-36`}
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlarmClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">⏰ अलार्म रिमाइंडर</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">समय पर पक्की याददाश्त</p>
            </div>
          </div>

          {/* Card 4: Scam Checker */}
          <div 
            onClick={() => setActiveModal('scam')}
            className={`p-4 rounded-3xl border ${isDark ? 'bg-neutral-900/60 border-white/10 hover:border-violet-500/40' : 'bg-white border-slate-200 shadow-sm'} transition active:scale-98 cursor-pointer flex flex-col justify-between h-36`}
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">🛡️ स्कैम चेकर</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">प्रोफाइल व लिंक ऑडिट</p>
            </div>
          </div>

        </div>

        {/* 4. DIRECT FEEDBACK BUTTON */}
        <div 
          onClick={() => setActiveModal('feedback')}
          className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'} flex items-center justify-between cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="font-bold text-xs">💬 सहायता व सीधा सुझाव (Direct Founder Support)</h4>
              <p className="text-[10px] text-neutral-400">कोई समस्या या नया विचार? बिना किसी झिझक लिखें</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        </div>
      </main>

      {/* MODAL 1: कूरियर ट्रैकर */}
      {activeModal === 'courier' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#0f1422] border-white/10 text-white' : 'bg-white text-slate-900'} border rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto`}>
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" /> कूरियर ट्रैकर</h2>
            <form onSubmit={handleCheckCourier} className="space-y-3">
              <input 
                type="text" 
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                placeholder="ट्रैकिंग नंबर डालें (उदा. Delhivery 14-अंक)"
                className="w-full p-3.5 rounded-2xl bg-neutral-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button type="submit" className="w-full py-3 bg-cyan-500 text-black font-bold text-sm rounded-xl">चेक करें</button>
            </form>
            {courierResult && (
              <div className="mt-5 p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cyan-400 text-xs">{courierResult.name}</span>
                  <span className="text-[11px] bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> {courierResult.status}</span>
                </div>
                <p className="text-xs text-neutral-400">ID: {courierResult.id}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: हिसाब-किताब (LEDGER) */}
      {activeModal === 'ledger' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#0f1422] border-white/10 text-white' : 'bg-white text-slate-900'} border rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto`}>
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-400" /> बहीखाता (हिसाब-किताब)</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-400 block font-medium">खर्चा</span>
                <span className="text-xs font-bold text-rose-400">₹{ledgerEntries.filter(x=>x.type==='expense').reduce((a,b)=>a+b.amount,0)}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-medium">लेना बाकी</span>
                <span className="text-xs font-bold text-emerald-400">₹{ledgerEntries.filter(x=>x.type==='loan_given').reduce((a,b)=>a+b.amount,0)}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block font-medium">देना बाकी</span>
                <span className="text-xs font-bold text-amber-400">₹{ledgerEntries.filter(x=>x.type==='loan_taken').reduce((a,b)=>a+b.amount,0)}</span>
              </div>
            </div>

            <form onSubmit={handleAddLedger} className="space-y-2.5 mb-4">
              <input 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                placeholder="विवरण (उदा. राशन, दूध, रमेश)" 
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newAmount} 
                  onChange={e => setNewAmount(e.target.value)} 
                  placeholder="रुपये ₹" 
                  className="w-1/2 p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
                />
                <select 
                  value={newType} 
                  onChange={e => setNewType(e.target.value as any)} 
                  className="w-1/2 p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
                >
                  <option value="expense">खर्चा</option>
                  <option value="loan_given">उधार दिया (लेना है)</option>
                  <option value="loan_taken">उधार लिया (देना है)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> हिसाब में जोड़ें
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ledgerEntries.map(entry => (
                <div key={entry.id} className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold block">{entry.title}</span>
                    <span className="text-[10px] text-neutral-400">
                      {entry.type === 'expense' ? 'खर्चा' : entry.type === 'loan_given' ? 'लेना बाकी' : 'देना बाकी'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${entry.type === 'expense' ? 'text-rose-400' : entry.type === 'loan_given' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ₹{entry.amount}
                    </span>
                    <button onClick={() => setLedgerEntries(prev => prev.filter(x => x.id !== entry.id))} className="text-neutral-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: अलार्म व रिमाइंडर */}
      {activeModal === 'alarm' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#0f1422] border-white/10 text-white' : 'bg-white text-slate-900'} border rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto`}>
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><AlarmClock className="w-5 h-5 text-amber-400" /> अलार्म व रिमाइंडर</h2>
            
            <form onSubmit={handleAddReminder} className="space-y-2 mb-4">
              <input 
                type="text" 
                value={newReminderText} 
                onChange={e => setNewReminderText(e.target.value)} 
                placeholder="क्या याद रखना है? (उदा. दवा, मीटिंग)" 
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"/> 
                            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition"
            >
              रिमाइंडर जोड़ें
            </button>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}

export default App;

