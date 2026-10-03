import React, { useState, useEffect } from 'react';
import { X, Lock, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import { ARC_MAINNET } from '../config';
import { encryptPayload, generateGateKey } from '../lib/crypto';

export default function CreateGateModal({ isOpen, onClose, onCreateGate, isCreating, isConnected, isArcNetwork }) {
  const dialogRef = useFocusTrap();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [secretPayload, setSecretPayload] = useState('');
  const [priceUsdc, setPriceUsdc] = useState('0.10');
  const [x402Enabled, setX402Enabled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isArcNetwork) {
      setError('Please switch your wallet to Arc Mainnet (Chain 5042).');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }

    if (!secretPayload.trim()) {
      setError('Please enter the secret link or payload to protect.');
      return;
    }

    const priceNum = parseFloat(priceUsdc);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid USDC price greater than 0.');
      return;
    }

    try {
      // Encrypt with a fresh random 256-bit gate key. The key is escrowed
      // server-side and released only against a verified on-chain unlock.
      const gateKey = generateGateKey();
      const encryptedPayload = await encryptPayload(secretPayload.trim(), gateKey);

      onCreateGate({
        title: title.trim(),
        description: description.trim(),
        secretPayload: encryptedPayload,
        gateKey,
        priceUsdc: priceUsdc.trim(),
        x402Enabled,
      });
    } catch (err) {
      console.error('Encryption failed:', err);
      setError('Failed to encrypt secret payload. Web Crypto API required.');
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-gate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 id="create-gate-modal-title" className="text-lg font-bold text-white tracking-tight">
              Create Paywalled Gate
            </h3>
            <p className="text-xs text-slate-400">
              Lock any secret link or text behind a micro-payment in native USDC.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Title <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Arc DeFi Strategy Alpha & Source Code"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Public Description
            </label>
            <textarea
              rows={2}
              placeholder="Briefly explain what buyers will unlock..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all resize-none"
            />
          </div>

          {/* Secret Payload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Secret Content / Link <span className="text-cyan-400">*</span></span>
              <span className="text-[10px] text-amber-400 font-normal">Encrypted until unlocked</span>
            </label>
            <textarea
              rows={3}
              placeholder="Private Google Drive link, Telegram invite, API key, Discord VIP link, or confidential text..."
              value={secretPayload}
              onChange={(e) => setSecretPayload(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Access Fee (USDC) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unlock Fee (USDC) <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.10"
                value={priceUsdc}
                onChange={(e) => setPriceUsdc(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-3.5 pr-16 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400">
                USDC
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {['0.05', '0.10', '0.25', '0.50', '1.00'].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPriceUsdc(preset)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    priceUsdc === preset
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue split note */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Creator Payout: <strong className="text-emerald-400">99%</strong></span>
            <span>Protocol Fee: <strong className="text-slate-300">1%</strong></span>
            <span>Finality: <strong className="text-cyan-400">&lt; 1s</strong></span>
          </div>

          {/* x402 agent payments opt-in */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-cyan-700 transition-all">
            <input
              type="checkbox"
              checked={x402Enabled}
              onChange={(e) => setX402Enabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-semibold">Enable x402 agent payments.</span>
              {' '}Lets autonomous AI agents pay this gate programmatically via the x402
              standard — no human clicks needed. Off by default; you can toggle it
              anytime from Creator Studio.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
          >
            {isCreating ? 'Deploying Gate On-Chain...' : 'Publish Paywalled Gate'}
          </button>
        </form>

      </div>
    </div>
  );
}
