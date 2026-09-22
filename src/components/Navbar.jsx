import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  ExternalLink,
  ArrowRightLeft,
  Sparkles,
  PlusCircle,
  Zap,
  Copy,
  Check,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { ARC_MAINNET } from '../config';

export default function Navbar({
  account,
  chainId,
  isConnecting,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  onOpenCreateModal,
  onOpenGuideModal,
  activeTab,
  setActiveTab,
  isDemoMode,
  setIsDemoMode,
}) {
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const isArcNetwork = chainId === ARC_MAINNET.chainId;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => {
            setActiveTab('explore');
            setIsMobileNavOpen(false);
          }}
        >
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
                {isDemoMode ? 'Sandbox' : 'Mainnet'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              USDC Micro-Paywall & Tipping Protocol
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
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

        {/* Action Controls & Wallet */}
        <div className="flex items-center space-x-2.5">
          
          {/* Mode Switcher Toggle (Zero Wallet Friction for Judges) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                !isDemoMode
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interact with real MetaMask and Arc Mainnet"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">Live</span> Mainnet
            </button>
            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                isDemoMode
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Test instantly with zero wallet friction"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Sandbox</span>
            </button>
          </div>

          {/* Create Gate Button */}
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>

          {/* Network Switcher Alert if on wrong network */}
          {!isDemoMode && account && !isArcNetwork && (
            <button
              onClick={onSwitchNetwork}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-all animate-pulse"
              title="Click to switch MetaMask to Arc Mainnet (Chain 5042)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch (5042)</span>
            </button>
          )}

          {/* Wallet Status / Connect Button with Interactive Dropdown Popover */}
          {isDemoMode ? (
            <div className="flex items-center space-x-1.5 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner text-amber-200 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>0xJudge...Arc</span>
            </div>
          ) : account ? (
            <div className="relative">
              <button
                onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-inner transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span className="text-xs font-mono font-medium text-slate-200">
                  {truncateAddress(account)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Wallet Interactive Popover Menu */}
              {isWalletMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 border border-slate-700 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono break-all">
                    Connected to Arc Mainnet
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2 transition-all mt-1"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAddress ? 'Address Copied!' : 'Copy Address'}</span>
                  </button>
                  <a
                    href={`${ARC_MAINNET.blockExplorer}/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View on Arc Explorer</span>
                  </a>
                  <button
                    onClick={() => {
                      setIsWalletMenuOpen(false);
                      if (onDisconnect) onDisconnect();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center space-x-2 transition-all border-t border-slate-800 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle (<1024px) */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Navigation Dropdown (<1024px) */}
      {isMobileNavOpen && (
        <div className="lg:hidden px-4 pt-2 pb-5 border-t border-slate-800/80 bg-[#07090e] space-y-2">
          <button
            onClick={() => {
              setActiveTab('explore');
              setIsMobileNavOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Explore Gates
          </button>
          <button
            onClick={() => {
              setActiveTab('tip');
              setIsMobileNavOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tip'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Instant Micro-Tip
          </button>
          <button
            onClick={() => {
              onOpenGuideModal();
              setIsMobileNavOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 flex items-center justify-between"
          >
            <span>DoraHacks Guide</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={() => {
              onOpenCreateModal();
              setIsMobileNavOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Paywalled Gate</span>
          </button>
        </div>
      )}

    </header>
  );
}
