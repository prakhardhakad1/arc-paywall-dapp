import React from 'react';
import { X, Award, Cpu, Rocket, Copy, Check } from 'lucide-react';
import { ARC_MAINNET } from '../config';

export default function GuideModal({ isOpen, onClose }) {
  const [copiedRpc, setCopiedRpc] = React.useState(false);

  if (!isOpen) return null;

  const copyRpc = () => {
    navigator.clipboard.writeText(ARC_MAINNET.rpcUrl);
    setCopiedRpc(true);
    setTimeout(() => setCopiedRpc(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Award className="w-6 h-6 text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Arc Microgrants ($500 USDC) Submission Guide
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Why ArcGate is engineered specifically for Circle's Arc Mainnet.
            </p>
          </div>
        </div>

        {/* Pillar 1: Why Arc */}
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center space-x-2 mb-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>The Arc Advantage: Native USDC Gas</span>
            </h4>
            <p className="leading-relaxed text-slate-300">
              Traditional EVM chains require users to pay gas in volatile tokens (like ETH) and perform a 2-step ERC-20 approval before paying with USDC. On Circle's <strong>Arc Mainnet</strong>, <strong>USDC is the native gas asset</strong>. ArcGate harnesses this to enable instant 1-click micro-payments without token approvals!
            </p>
          </div>

          {/* Network Parameters */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Arc Mainnet Network Specs</span>
              <button
                onClick={copyRpc}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center space-x-1"
              >
                {copiedRpc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy RPC</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-400 pt-1">
              <div>• Chain ID: <span className="text-white">5042 (0x13b2)</span></div>
              <div>• Currency: <span className="text-cyan-300">USDC (18 dec)</span></div>
              <div>• RPC: <span className="text-slate-300 truncate">rpc.mainnet.arc.io</span></div>
              <div>• Explorer: <span className="text-slate-300">explorer.arc.io</span></div>
            </div>
          </div>

          {/* 3 Step Deployment Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <span>Quick Deployment Steps (Zero Knowledge Needed)</span>
            </h4>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-semibold text-white">Deploy Smart Contract via Remix</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Open Remix Ethereum in your browser, paste <code className="text-cyan-300">contracts/ArcPaywall.sol</code>, select "Injected Provider - MetaMask" (connected to Arc Mainnet), and click Deploy.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-semibold text-white">Paste Contract Address into Frontend</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Update <code className="text-cyan-300">ARC_PAYWALL_CONTRACT_ADDRESS</code> in <code className="text-slate-300">src/config.js</code> with your deployed address.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-semibold text-white">Deploy to Vercel & Submit to DoraHacks</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Push this project to GitHub, import to Vercel (1 click), and submit your live link & GitHub repo to the DoraHacks Arc Microgrants page!
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Got it, let's explore!
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
