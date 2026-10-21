import React, { useState } from 'react';
import { Clock, X, CheckCircle2, BellRing } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

export interface ReminderEntry {
  id: string;
  title: string;
  targetTime: number;
  timeString: string;
  completed: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderEntry[];
  setReminders: React.Dispatch<React.SetStateAction<ReminderEntry[]>>;
}

export default function ReminderModal({ isOpen, onClose, reminders, setReminders }: Props) {
  const [taskText, setTaskText] = useState('');
  const [minutes, setMinutes] = useState('5');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText) return;

    const delayMinutes = parseFloat(minutes) || 5;
    const target = Date.now() + delayMinutes * 60 * 1000;
    const timeStr = new Date(target).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });

    const newRem: ReminderEntry = {
      id: Date.now().toString(),
      title: taskText,
      targetTime: target,
      timeString: timeStr,
      completed: false,
    };

    setReminders(prev => [newRem, ...prev]);
    setTaskText('');
    playVoiceClip('reminder-set');
  };

  const handleDone = (id: string) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, completed: true } : r)));
    playVoiceClip('task-done');
  };

  const pendingCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-amber-400">
          <Clock className="w-5 h-5" /> अलार्म व रिमाइंडर
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-normal ml-auto mr-8">
            {pendingCount} पेंडिंग
          </span>
        </h2>

        {/* Task Form */}
        <form onSubmit={handleAdd} className="space-y-2 mb-4">
          <input
            type="text"
            value={taskText}
            onChange={e => setTaskText(e.target.value)}
            placeholder="काम का नाम (उदा. पानी पीना, दवा लेनी है)"
            className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-amber-500"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1 p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300">
              <span className="text-[11px] text-neutral-400">कितने मिनट बाद:</span>
              <input
                type="number"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                min="1"
                className="w-14 p-1 rounded bg-black/50 text-center font-bold text-amber-400 outline-none"
              />
              <span className="text-[11px] text-neutral-400">मि.</span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition"
            >
              अलार्म लगाओ
            </button>
          </div>
        </form>

        {/* Reminders List */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {reminders.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-6">कोई पेंडिंग रिमाइंडर नहीं है</p>
          ) : (
            reminders.map(rem => (
              <div
                key={rem.id}
                className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className={`block font-medium ${rem.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                    {rem.title}
                  </span>
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                    <BellRing className="w-3 h-3 text-amber-400" /> {rem.timeString}
                  </span>
                </div>
                {!rem.completed ? (
                  <button
                    onClick={() => handleDone(rem.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-500 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full">
                    पूरा हुआ
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
