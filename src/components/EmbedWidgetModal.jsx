import React, { useState } from 'react';
import { X, Code2, Copy, Check, ShieldCheck, Eye, Sparkles } from 'lucide-react';

export default function EmbedWidgetModal({ isOpen, onClose, gate }) {
  const [activeTab, setActiveTab] = useState('script');
  const [copied, setCopied] = useState(false);
  const [previewFeedback, setPreviewFeedback] = useState(false);

  if (!isOpen || !gate) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://arcgate.vercel.app';

  const snippets = {
    script: `<!-- 1-Line ArcGate Paywall Embed -->
<script 
  src="${currentHost}/widget.js" 
  data-gate-id="${gate.id}"
  data-theme="dark"
  async>
</script>`,

    iframe: `<!-- ArcGate Iframe Embed (WordPress / Notion / Substack) -->
<iframe 
  src="${currentHost}/embed/${gate.id}" 
  width="100%" 
  height="300" 
  frameborder="0" 
  style="border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.2);"
  allow="clipboard-write">
</iframe>`,

    react: `// React / Next.js Component Embed
import { ArcGatePaywall } from '@arcgate/react';

export default function PremiumArticle() {
  return (
    <ArcGatePaywall 
      gateId={${gate.id}} 
      price="${gate.priceUsdcFormatted} USDC"
      onUnlock={(secret) => console.log('Secret decrypted:', secret)}
    />
  );
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewClick = () => {
    setPreviewFeedback(true);
    setTimeout(() => setPreviewFeedback(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                1-Line Embed Widget Generator
              </h3>
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Developer Tooling
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Embed this ArcGate paywall on blogs, WordPress, Notion docs, or custom web apps.
            </p>
          </div>
        </div>

        {/* Gate Summary Badge */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 mb-5 flex items-center justify-between">
          <div className="truncate pr-4">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Gate #{gate.id}</span>
            <span className="text-xs font-semibold text-white truncate block">{gate.title}</span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Unlock Fee</span>
            <span className="text-xs font-bold text-cyan-400">{gate.priceUsdcFormatted} USDC</span>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex space-x-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'script'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Line &lt;script&gt;
          </button>
          <button
            onClick={() => setActiveTab('iframe')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'iframe'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            &lt;iframe&gt; (Notion/Blogs)
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'react'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            React / Next.js
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="relative mb-6">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all z-10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
          <pre className="p-4 pt-10 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto whitespace-pre">
            {snippets[activeTab]}
          </pre>
        </div>

        {/* Live Widget Preview */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center space-x-2">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Embedded Appearance Preview</span>
            </span>
            {previewFeedback && (
              <span className="text-[11px] text-emerald-400 font-normal animate-pulse flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Simulating 1-click Arc USDC checkout...</span>
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Protected by ArcGate • Arc Mainnet</span>
              </span>
              <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{gate.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-1">{gate.description}</p>
            </div>
            <button
              onClick={handlePreviewClick}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 whitespace-nowrap transition-all active:scale-95"
            >
              Unlock for {gate.priceUsdcFormatted} USDC
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
