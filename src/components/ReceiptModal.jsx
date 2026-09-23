import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Shield,
  ArrowUpRight,
  Coins,
  FileText,
  KeyRound,
  FlaskConical,
} from 'lucide-react';
import { ARC_MAINNET } from '../config';
import { formatReceiptId, formatLicenseId } from '../lib/typedIds';

export default function ReceiptModal({ isOpen, onClose, receipt, onAccessContent }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) return null;

  const isDemo = Boolean(receipt.isDemoMode);

  const handleCopyHash = async () => {
    if (receipt.txHash && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(receipt.txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Clipboard write permission denied:', err);
      }
    }
  };

  const receiptId = formatReceiptId(receipt.txHash, isDemo);
  const licenseId = formatLicenseId(receipt.gateId, receipt.buyer, isDemo);

  const amountNum = parseFloat(receipt.amountUsdc || '0.10');
  const creatorAmount = (amountNum * 0.99).toFixed(4);
  const protocolFee = (amountNum * 0.01).toFixed(4);
  const explorerUrl = `${ARC_MAINNET.blockExplorer}/tx/${receipt.txHash}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button with accessible name */}
        <button
          onClick={onClose}
          aria-label="Close transaction receipt"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header / Watermark */}
        <div className="flex items-center space-x-3 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white animate-in zoom-in duration-300 ${
              isDemo
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/30'
            }`}
          >
            {isDemo ? <FlaskConical className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 id="receipt-dialog-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isDemo ? 'Sandbox Payment Settled' : 'Payment Settled'}
              </h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isDemo
                    ? 'text-amber-300 bg-amber-950/90 border-amber-500/40'
                    : 'text-emerald-300 bg-emerald-950/90 border-emerald-500/30'
                }`}
              >
                {isDemo ? '🧪 SIMULATED' : 'FINALIZED'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isDemo
                ? 'Simulated execution verified locally (Zero Gas Paid).'
                : 'Native Arc USDC settlement with sub-second finality.'}
            </p>
          </div>
        </div>

        {/* Amount Paid Breakdown Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="text-center py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block mb-1">
              Amount Paid
            </span>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {receipt.amountUsdc}
              </span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                USDC
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-300 block text-[11px]">Creator Payout (99%):</span>
              <span className="font-semibold text-emerald-300 font-mono">+{creatorAmount} USDC</span>
            </div>
            <div className="text-right">
              <span className="text-slate-300 block text-[11px]">Protocol Fee (1%):</span>
              <span className="font-semibold text-slate-300 font-mono">{protocolFee} USDC</span>
            </div>
          </div>
        </div>

        {/* Telemetry Details */}
        <div className="space-y-2 mb-6 text-xs text-slate-200">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Receipt ID</span>
            </span>
            <span className="font-mono text-cyan-300 font-semibold text-[11px]">{receiptId}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>License Token</span>
            </span>
            <span className="font-mono text-emerald-300 font-semibold text-[11px]">{licenseId}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Execution Network</span>
            </span>
            <span className="font-semibold text-white">
              {isDemo ? 'Arc Sandbox Simulation (5042)' : 'Circle Arc Mainnet (5042)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Gas Approval Model</span>
            </span>
            <span className="font-semibold text-emerald-300">
              {isDemo ? 'Zero Gas (Sandbox Simulation)' : '0 Approvals Needed (Native USDC)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Transaction Hash</span>
              <button
                onClick={handleCopyHash}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
            <span className="font-mono text-[11px] text-slate-300 break-all select-all block">
              {receipt.txHash}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {onAccessContent && (
            <button
              onClick={() => {
                onClose();
                onAccessContent();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Access Unlocked Secret Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}

          {isDemo ? (
            <div className="w-full py-2.5 px-4 rounded-xl text-xs text-center text-amber-300 bg-amber-950/40 border border-amber-500/30 font-medium">
              🧪 Simulated Sandbox Transaction (No on-chain gas paid)
            </div>
          ) : (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>View on ArcScan Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
