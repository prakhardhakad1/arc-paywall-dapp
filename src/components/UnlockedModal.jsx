import React, { useState } from 'react';
import { X, Unlock, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function UnlockedModal({ isOpen, onClose, gate }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !gate) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(gate.secretPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLink = gate.secretPayload && (gate.secretPayload.startsWith('http://') || gate.secretPayload.startsWith('https://'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Unlock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Gate Unlocked
              </h3>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Access confirmed on Circle's Arc Mainnet.
            </p>
          </div>
        </div>

        {/* Gate info */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-1">{gate.title}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{gate.description}</p>
        </div>

        {/* Secret Payload Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protected Secret Payload</span>
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-slate-300 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs font-mono text-cyan-200 break-all select-all whitespace-pre-wrap max-h-48 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
            {gate.secretPayload || 'No payload specified.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isLink && (
            <a
              href={gate.secretPayload}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <span>Open Link Directly</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
