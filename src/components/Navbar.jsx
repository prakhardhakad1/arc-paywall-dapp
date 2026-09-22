import React from 'react';
import { ShieldCheck, Wallet, ExternalLink, ArrowRightLeft, Sparkles, PlusCircle } from 'lucide-react';
import { ARC_MAINNET } from '../config';

export default function Navbar({
  account,
  chainId,
  isConnecting,
  onConnect,
  onSwitchNetwork,
  onOpenCreateModal,
  onOpenGuideModal,
  activeTab,
  setActiveTab
}) {
  const isArcNetwork = chainId === ARC_MAINNET.chainId;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Arc<span className="text-cyan-400">Gate</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                Mainnet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              USDC Micro-Paywall & Tipping Protocol
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'explore'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore Gates
          </button>
          <button
            onClick={() => setActiveTab('tip')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tip'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant Tip
          </button>
          <button
            onClick={onOpenGuideModal}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg flex items-center space-x-1 transition-all"
          >
            <span>DoraHacks Guide</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </nav>

        {/* Action Buttons & Wallet */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Gate</span>
          </button>

          {/* Network Switcher Alert if on wrong network */}
          {account && !isArcNetwork && (
            <button
              onClick={onSwitchNetwork}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-all animate-pulse"
              title="Click to switch MetaMask to Arc Mainnet (Chain 5042)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch to Arc (5042)</span>
            </button>
          )}

          {/* Connected Network Badge */}
          {account && isArcNetwork && (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Arc Mainnet</span>
            </div>
          )}

          {/* Connect / Account Button */}
          {account ? (
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
              <span className="text-xs font-mono font-medium text-slate-200">
                {truncateAddress(account)}
              </span>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
