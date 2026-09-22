import React from 'react';
import { Check, X, Zap, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';

export default function BenchmarkCard() {
  const comparisons = [
    {
      metric: 'Checkout Flow',
      arc: '1-Click Native Checkout',
      arcHighlight: true,
      eth: '2-Step Approval (Approve + Transfer)',
      ethHighlight: false,
    },
    {
      metric: 'Gas Asset',
      arc: 'Native USDC (Zero Volatility)',
      arcHighlight: true,
      eth: 'Volatile ETH (Requires Swapping)',
      ethHighlight: false,
    },
    {
      metric: 'Average Gas Fee',
      arc: '~$0.001 USDC (Negligible)',
      arcHighlight: true,
      eth: '$3.50 – $12.00+ (Extravagant)',
      ethHighlight: false,
    },
    {
      metric: 'Finality & Settlement',
      arc: '< 1.0s (Sub-Second)',
      arcHighlight: true,
      eth: '15s – 60s (Slow confirmation)',
      ethHighlight: false,
    },
    {
      metric: '$0.10 Micro-Payments',
      arc: '100% Viable & Instant',
      arcHighlight: true,
      eth: 'Economically Broken (Gas > Price)',
      ethHighlight: false,
    },
  ];

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 mb-10 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Circle Architecture Benchmark</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Why Arc Mainnet Wins for Micro-Transactions
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            See how Circle's native USDC gas model eliminates the multi-step approval tax and enables real-world micro-monetization.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Arc Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-500/40 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
              <h4 className="text-base font-extrabold text-white">Circle's Arc Mainnet</h4>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-900/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Optimized
            </span>
          </div>

          <div className="space-y-3.5">
            {comparisons.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono uppercase">
                    {item.metric}
                  </span>
                  <span className="font-semibold text-slate-100">{item.arc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legacy Ethereum Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-400">Legacy Ethereum / Standard L2s</h4>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              High Friction
            </span>
          </div>

          <div className="space-y-3.5">
            {comparisons.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono uppercase">
                    {item.metric}
                  </span>
                  <span className="font-medium text-slate-400">{item.eth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
