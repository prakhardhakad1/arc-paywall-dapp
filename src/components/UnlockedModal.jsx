import React, { useState, useEffect } from 'react';
import { X, Unlock, Copy, Check, ExternalLink, ShieldCheck, Key } from 'lucide-react';
import { decryptPayload, getDemoGateKey } from '../lib/crypto';

export default function UnlockedModal({ isOpen, onClose, gate, isDemoMode }) {
  const [copied, setCopied] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Decrypt secret payload on-the-fly client side
  useEffect(() => {
    if (gate?.secretPayload) {
      setIsDecrypting(true);
      const gateKey = getDemoGateKey(gate.id);
      decryptPayload(gate.secretPayload, gateKey)
        .then((text) => {
          setDecryptedText(text);
          setIsDecrypting(false);
        })
        .catch(() => {
          setDecryptedText(gate.secretPayload);
          setIsDecrypting(false);
        });
    } else {
      setDecryptedText('');
      setIsDecrypting(false);
    }
  }, [gate]);

  if (!isOpen || !gate) return null;

  const handleCopy = async () => {
    if (decryptedText && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(decryptedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Clipboard write permission denied:', err);
      }
    }
  };

  // Safely extract valid URL using regex even if payload contains instructions/passcodes
  const cleanUrl = decryptedText ? decryptedText.match(/https?:\/\/[^\s]+/)?.[0] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlocked-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative">
        
        {/* Close Button with accessible name */}
        <button
          onClick={onClose}
          aria-label="Close unlocked secret dialog"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 id="unlocked-dialog-title" className="text-lg font-bold text-white tracking-tight">
                Gate Unlocked
              </h3>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {isDemoMode ? '🧪 Sandbox Verified' : 'Verified On-Chain'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isDemoMode
                ? 'Access unlocked via Sandbox Simulation (Zero Gas).'
                : 'Access confirmed on Circle’s Arc Mainnet.'}
            </p>
          </div>
        </div>

        {/* Gate info */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-1">{gate.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{gate.description}</p>
        </div>

        {/* Secret Payload Box with AES-256-GCM indicator */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Decrypted AES-256-GCM Payload</span>
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-slate-200 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs font-mono text-cyan-200 break-all select-all whitespace-pre-wrap max-h-48 overflow-y-auto p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
            {isDecrypting ? (
              <span className="text-slate-400 italic">Decrypting payload with license token...</span>
            ) : (
              decryptedText || 'No payload specified.'
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {cleanUrl && (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Open Link Directly</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
