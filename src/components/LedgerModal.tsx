import React, { useState } from 'react';
import { BookOpen, X, Trash2 } from 'lucide-react';
import { playVoiceClip } from '../utils/audio';

export interface LedgerEntry {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'loan_given' | 'loan_taken';
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entries: LedgerEntry[];
  setEntries: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
}

export default function LedgerModal({ isOpen, onClose, entries, setEntries }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'loan_given' | 'loan_taken'>('expense');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      title,
      amount: parseFloat(amount),
      type,
      date: new Date().toLocaleDateString('hi-IN'),
    };

    setEntries(prev => [newEntry, ...prev]);
    setTitle('');
    setAmount('');
    playVoiceClip('ledger-added');
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(item => item.id !== id));
  };

  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const totalLoanGiven = entries.filter(e => e.type === 'loan_given').reduce((sum, e) => sum + e.amount, 0);
  const totalLoanTaken = entries.filter(e => e.type === 'loan_taken').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-5 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-emerald-400">
          <BookOpen className="w-5 h-5" /> दैनिक खाता बुक
        </h2>

        {/* 3 Summary Pills */}
        <div className="grid grid-cols-3 gap-1.5 mb-4 text-center">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-neutral-400 block">खर्चा</span>
            <span className="text-xs font-bold text-rose-400">₹{totalExpense}</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-neutral-400 block">लेना बाकी</span>
            <span className="text-xs font-bold text-emerald-400">₹{totalLoanGiven}</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-neutral-400 block">देना बाकी</span>
            <span className="text-xs font-bold text-amber-400">₹{totalLoanTaken}</span>
          </div>
        </div>

        {/* Entry Form */}
        <form onSubmit={handleAdd} className="space-y-2 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="विवरण (उदा. चाय, राशन)"
              className="flex-1 p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="रकम ₹"
              className="w-20 p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="flex-1 p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300 outline-none"
            >
              <option value="expense">खर्चा (Expense)</option>
              <option value="loan_given">उधार दिया (Lena Hai)</option>
              <option value="loan_taken">उधार लिया (Dena Hai)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition"
            >
              जोड़ें
            </button>
          </div>
        </form>

        {/* Entry List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-6">खाता एकदम खाली व साफ़ है</p>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold block text-neutral-200">{entry.title}</span>
                  <span className="text-[10px] text-neutral-400">
                    {entry.type === 'expense' ? 'खर्चा' : entry.type === 'loan_given' ? 'लेना बाकी' : 'देना बाकी'} • {entry.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      entry.type === 'expense'
                        ? 'text-rose-400'
                        : entry.type === 'loan_given'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    ₹{entry.amount}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1 transition"
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
  );
}
