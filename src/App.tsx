import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Mic, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { playVoiceClip } from './soundengine';
import TrackCourierModal from './trackcouriermodal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'courier' | 'scam' | 'reminders' | 'ledger'>('home');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [isListening, setIsListening] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  // Mock Task/Hisab Stats
  const [tasks, setTasks] = useState([
    { id: 1, text: 'बिजली का बिल भरना', done: false, time: 'आज शाम 6:00' },
    { id: 2, text: 'दूध वाले के पैसे ₹850', done: true, time: 'कल सुबह' }
  ]);

  const handleTaskToggle = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.done;
        if (nextState && !voiceMuted) {
          playVoiceClip('task-done');
        }
        return { ...t, done: nextState };
      }
      return t;
    }));
  };

  const handleMicTap = () => {
    setIsListening(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-neutral-950 pb-12">
      {/* Top Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Buddy AI
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v1.0</span>
            </h1>
            <p className="text-xs text-neutral-400">आवाज़ से चलने वाला साथी</p>
          </div>
        </div>

        {/* Gender Voice Selector & Mute Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-900/90 p-1 rounded-xl border border-white/10 text-xs">
            <button 
              onClick={() => setSelectedGender('male')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${selectedGender === 'male' ? 'bg-cyan-500 text-black shadow-sm' : 'text-neutral-400'}`}
            >
              बिडू (M)
            </button>
            <button 
              onClick={() => setSelectedGender('female')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${selectedGender === 'female' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400'}`}
            >
              सखी (F)
            </button>
          </div>

          <button 
            onClick={() => setVoiceMuted(!voiceMuted)}
            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300"
            aria-label="Toggle Voice"
          >
            {voiceMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">
        
        {/* Aura Sphere / Voice Hero */}
        <section className="flex flex-col items-center justify-center py-4">
          <div className="relative flex items-center justify-center">
            {/* Glowing Aura Rings */}
            <div className={`absolute w-44 h-44 rounded-full bg-cyan-500/15 blur-2xl transition-all duration-700 ${isListening ? 'scale-125 bg-cyan-400/30' : ''}`} />
            <div className={`absolute w-36 h-36 rounded-full bg-blue-600/20 blur-xl transition-all duration-500 ${isListening ? 'scale-110' : ''}`} />
            
            {/* Center Mic Button */}
            <button 
              onClick={handleMicTap}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 border transition-all duration-300 active:scale-95 ${
                isListening 
                  ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border-white text-black shadow-[0_0_35px_rgba(6,182,212,0.6)]' 
                  : 'bg-neutral-900/90 border-cyan-500/30 text-white shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:border-cyan-400'
              }`}
            >
              <Mic className={`w-9 h-9 ${isListening ? 'animate-bounce text-black' : 'text-cyan-400'}`} />
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isListening ? 'text-black' : 'text-neutral-300'}`}>
                {isListening ? 'सुन रहा हूँ...' : 'बोलें'}
              </span>
            </button>
          </div>
          <p className="mt-4 text-xs text-neutral-400 text-center font-medium">
            "पार्सल कहाँ पहुँचा", "₹200 खर्चा लिखो" या "कल सुबह 7 बजे याद दिलाओ"
          </p>
        </section>

        {/* 2x2 Feature Action Grid */}
        <section className="grid grid-cols-2 gap-3.5">
          {/* Tile 1: कूरियर ट्रैकर */}
          <button 
            onClick={() => setActiveTab('courier')}
            className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 hover:border-cyan-500/40 text-left transition flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:bg-cyan-500 group-hover:text-black transition">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">📦 कूरियर ट्रैक</h2>
              <span className="inline-block mt-1 text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Delhivery & 40+
              </span>
            </div>
          </button>

          {/* Tile 2: स्कैम चेकर */}
          <button 
            onClick={() => setActiveTab('scam')}
            className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 hover:border-purple-500/40 text-left transition flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">🛡️ स्कैम चेकर</h2>
              <span className="inline-block mt-1 text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                फ़र्जी पेज ऑडिट
              </span>
            </div>
          </button>

          {/* Tile 3: अलार्म व रिमाइंडर */}
          <button 
            onClick={() => setActiveTab('reminders')}
            className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 hover:border-amber-500/40 text-left transition flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-500 group-hover:text-black transition">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">⏰ अलार्म / टास्क</h2>
              <span className="inline-block mt-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                वॉयस रिमाइंडर
              </span>
            </div>
          </button>

          {/* Tile 4: हिसाब-किताब */}
          <button 
            onClick={() => setActiveTab('ledger')}
            className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 hover:border-emerald-500/40 text-left transition flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500 group-hover:text-black transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">💰 बहीखाता</h2>
              <span className="inline-block mt-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                उधार व खर्चा
              </span>
            </div>
          </button>
        </section>

        {/* Quick Recent Tasks List */}
        <section className="bg-[#0f1422] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">आज के ज़रूरी काम</h3>
            <span className="text-[11px] text-cyan-400">2 कुल</span>
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => handleTaskToggle(task.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  task.done 
                    ? 'bg-neutral-950/40 border-white/5 text-neutral-500 line-through' 
                    : 'bg-neutral-900/80 border-white/10 text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${task.done ? 'bg-cyan-500 border-cyan-500 text-black font-bold' : 'border-neutral-600'}`}>
                    {task.done ? '✓' : ''}
                  </div>
                  <span className="text-sm font-medium">{task.text}</span>
                </div>
                <span className="text-[11px] text-neutral-500">{task.time}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Courier Modal */}
      {activeTab === 'courier' && (
        <TrackCourierModal onClose={() => setActiveTab('home')} />
      )}
    </div>
  );
        }
