import React, { useState } from 'react';
import { Terminal, Bot, Play, CheckCircle2, Copy, Check, Sparkles, Zap, ShieldAlert } from 'lucide-react';

export default function AgentTerminalCard() {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState([]);

  const liveOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://arc-paywall-dapp.vercel.app';

  const snippets = {
    curl: `# 1. Agent queries paywalled endpoint (receives real HTTP 402 Payment Required)
curl -i ${liveOrigin}/api/gate/1

# 2. Agent signs 0.10 USDC tx on Arc and fetches with on-chain proof
curl -X POST ${liveOrigin}/api/unlock \\
  -H "Content-Type: application/json" \\
  -H "X-Arc-Tx-Hash: 0x9f81a7c3e5b128da401f89c62b48d591a3c7e4b2d8f019c5a6e38b47219d50" \\
  -d '{"gate_id": 1, "agent_id": "agent-gpt4o-alpha"}'`,

    python: `# Python Agentic Commerce with Arc Sub-Second Finality
import requests
from web3 import Web3

# 1. Connect to Arc Mainnet (Chain 5042)
w3 = Web3(Web3.HTTPProvider("https://rpc.mainnet.arc.io"))

# 2. Execute 1-click native USDC payment (no approval needed!)
tx_hash = paywall_contract.functions.unlockGate(1).transact({
    "value": w3.to_wei(0.10, "ether"),  # Native USDC on Arc uses 18 decimals
    "from": agent_wallet.address
})

# 3. Retrieve decrypted payload
res = requests.post("${liveOrigin}/api/unlock", headers={
    "X-Arc-Tx-Hash": tx_hash.hex()
})
print("Agent Knowledge Unlocked:", res.json()["secret_payload"])`,

    typescript: `// TypeScript / LangChain Tool Definition
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ethers } from "ethers";

export const arcPaywallTool = new DynamicStructuredTool({
  name: "unlock_arc_alpha",
  description: "Unlocks paywalled research data on Circle Arc Mainnet",
  schema: z.object({ gateId: z.number() }),
  func: async ({ gateId }) => {
    const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.arc.io");
    const wallet = new ethers.Wallet(process.env.AGENT_KEY, provider);
    // Instant settlement in <1s!
    const tx = await contract.unlockGate(gateId, { value: ethers.parseEther("0.10") });
    await tx.wait(1);
    const res = await fetch("${liveOrigin}/api/unlock", {
      method: "POST",
      headers: { "X-Arc-Tx-Hash": tx.hash, "Content-Type": "application/json" },
      body: JSON.stringify({ gate_id: gateId })
    });
    return await res.json();
  }
});`
  };

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippets[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write permission denied:', err);
    }
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);

    const steps = [
      { text: '[AGENT] 🤖 Autonomous bot querying: /api/gate/1', delay: 200 },
      { text: '[SERVER] 🛑 HTTP 402 Payment Required: 0.10 USDC on Arc Mainnet (Chain 5042)', delay: 600, color: 'text-amber-400' },
      { text: '[AGENT] ⚡ Signing native USDC micro-payment (Tx: 0x9f81a7c3...3b42)', delay: 1100, color: 'text-cyan-300' },
      { text: '[NETWORK] 🚀 Arc Consensus confirmed in 0.42s (Sub-second finality)', delay: 1700, color: 'text-emerald-400' },
      { text: '[SERVER] ✅ HTTP 200 OK: Secret Alpha payload delivered to Agent memory!', delay: 2200, color: 'text-white font-bold' },
    ];

    steps.forEach(({ text, delay, color }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { text, color: color || 'text-slate-300' }]);
      }, delay);
    });

    setTimeout(() => {
      setIsSimulating(false);
    }, 2500);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden mb-10">
      
      {/* Glow behind terminal */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold mb-2">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agentic Commerce Architecture</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Autonomous AI Agent Micropayments
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            ArcGate is built for both human creators and autonomous AI agents. AI bots can programmatically unlock high-value datasets and API tools using HTTP 402 payment headers.
          </p>
        </div>

        {/* Live Simulation Button */}
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Simulating Agent Payment...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>Simulate HTTP 402 Flow</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Window */}
      <div className="bg-[#05070a] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-2">arcgate-agent-client</span>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {['curl', 'python', 'typescript'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-4 sm:p-5 font-mono text-xs overflow-x-auto relative">
          <button
            onClick={handleCopy}
            aria-label="Copy terminal snippet"
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <pre className="text-slate-300 leading-relaxed">{snippets[activeTab]}</pre>

          {/* Interactive Simulation Log Box */}
          {logs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                Execution Output (Arc Sub-Second Engine):
              </div>
              {logs.map((log, idx) => (
                <div key={idx} className={`text-xs ${log.color}`}>
                  {log.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
