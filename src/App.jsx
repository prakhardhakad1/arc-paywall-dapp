import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { ShieldCheck, Sparkles, ExternalLink, ArrowRight, Lock, Zap, Layers, RefreshCw } from 'lucide-react';

import Navbar from './components/Navbar';
import StatsBento from './components/StatsBento';
import ExploreGates from './components/ExploreGates';
import CreateGateModal from './components/CreateGateModal';
import TipModal from './components/TipModal';
import UnlockedModal from './components/UnlockedModal';
import GuideModal from './components/GuideModal';

import {
  ARC_MAINNET,
  ARC_PAYWALL_CONTRACT_ADDRESS,
  ARC_PAYWALL_ABI,
  DEMO_GATES,
} from './config';

export default function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');

  // Gates State
  const [gates, setGates] = useState(DEMO_GATES);
  const [stats, setStats] = useState({
    volumeUsdc: '142.50',
    totalGates: '3',
    totalUnlocks: '134',
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState('');
  const [selectedUnlockedGate, setSelectedUnlockedGate] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Loading States
  const [unlockingId, setUnlockingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const isContractConfigured =
    ARC_PAYWALL_CONTRACT_ADDRESS &&
    ARC_PAYWALL_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // -------------------------------------------------------------
  // WALLET & NETWORK HANDLERS
  // -------------------------------------------------------------

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        }
      } catch (err) {
        console.error('Wallet check error:', err);
      }
    }
  };

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });

      window.ethereum.on('chainChanged', (hexChainId) => {
        setChainId(parseInt(hexChainId, 16));
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask to interact.', 'error');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (currentChainId !== ARC_MAINNET.chainId) {
        switchNetwork();
      } else {
        showToast('Connected to Arc Mainnet!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to connect wallet', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_MAINNET.chainIdHex }],
      });
      setChainId(ARC_MAINNET.chainId);
      showToast('Switched to Arc Mainnet (5042)', 'success');
    } catch (switchError) {
      // 4902 means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ARC_MAINNET.chainIdHex,
                chainName: ARC_MAINNET.chainName,
                nativeCurrency: ARC_MAINNET.currency,
                rpcUrls: [ARC_MAINNET.rpcUrl],
                blockExplorerUrls: [ARC_MAINNET.blockExplorer],
              },
            ],
          });
          setChainId(ARC_MAINNET.chainId);
          showToast('Added and switched to Arc Mainnet!', 'success');
        } catch (addError) {
          console.error('Failed to add Arc network', addError);
          showToast('Could not add Arc Mainnet to wallet', 'error');
        }
      } else {
        console.error(switchError);
        showToast('Network switch cancelled', 'error');
      }
    }
  };

  // -------------------------------------------------------------
  // CONTRACT DATA FETCHING
  // -------------------------------------------------------------

  const fetchContractGates = async () => {
    if (!isContractConfigured || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        ARC_PAYWALL_CONTRACT_ADDRESS,
        ARC_PAYWALL_ABI,
        provider
      );

      const recentGates = await contract.getRecentGates(0, 20);
      const contractStats = await contract.getProtocolStats();

      if (recentGates && recentGates.length > 0) {
        const formatted = recentGates.map((g) => ({
          id: Number(g.id),
          creator: g.creator,
          title: g.title,
          description: g.description,
          priceUsdcWei: g.priceUsdcWei.toString(),
          priceUsdcFormatted: ethers.formatUnits(g.priceUsdcWei, 18),
          unlockCount: Number(g.unlockCount),
          createdAt: Number(g.createdAt),
          active: g.active,
          isUnlocked: g.isUnlocked,
          secretPayload: g.secretPayload,
        }));
        setGates(formatted);
      }

      setStats({
        volumeUsdc: ethers.formatUnits(contractStats[3], 18),
        totalGates: contractStats[0].toString(),
        totalUnlocks: contractStats[1].toString(),
      });
    } catch (err) {
      console.warn('Contract data fetch fallback to demo:', err);
    }
  };

  useEffect(() => {
    if (account && chainId === ARC_MAINNET.chainId) {
      fetchContractGates();
    }
  }, [account, chainId]);

  // -------------------------------------------------------------
  // ACTIONS: UNLOCK, CREATE, TIP
  // -------------------------------------------------------------

  const handleUnlock = async (gate) => {
    if (!account) {
      connectWallet();
      return;
    }

    if (chainId !== ARC_MAINNET.chainId) {
      switchNetwork();
      return;
    }

    setUnlockingId(gate.id);

    try {
      if (isContractConfigured) {
        // Real on-chain unlock on Arc Mainnet
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.unlockGate(gate.id, {
          value: BigInt(gate.priceUsdcWei),
        });

        showToast(`Transaction broadcast: ${tx.hash.slice(0, 10)}... Waiting for Arc finality`, 'info');
        await tx.wait(1);

        // Fetch refreshed gate
        const unlockedData = await contract.getGate(gate.id);
        const updatedGate = {
          ...gate,
          isUnlocked: true,
          unlockCount: Number(unlockedData.unlockCount),
          secretPayload: unlockedData.secretPayload,
        };

        setGates((prev) => prev.map((g) => (g.id === gate.id ? updatedGate : g)));
        setSelectedUnlockedGate(updatedGate);
      } else {
        // Interactive Demo mode confirmation
        await new Promise((resolve) => setTimeout(resolve, 800));
        const updatedGate = {
          ...gate,
          isUnlocked: true,
          unlockCount: gate.unlockCount + 1,
        };
        setGates((prev) => prev.map((g) => (g.id === gate.id ? updatedGate : g)));
        setSelectedUnlockedGate(updatedGate);
      }

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(`Success! Gate #${gate.id} unlocked via Arc Mainnet native USDC.`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || 'Unlock transaction failed', 'error');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleCreateGate = async (newGateData) => {
    setIsCreating(true);

    try {
      const priceWei = ethers.parseUnits(newGateData.priceUsdc, 18);

      if (isContractConfigured) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.createGate(
          newGateData.title,
          newGateData.description,
          newGateData.secretPayload,
          priceWei
        );

        showToast(`Gate publishing broadcast: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
        await fetchContractGates();
      } else {
        // Local interactive demo state
        await new Promise((resolve) => setTimeout(resolve, 600));
        const localGate = {
          id: gates.length + 1,
          creator: account || '0xYourWalletAddress',
          title: newGateData.title,
          description: newGateData.description,
          priceUsdcWei: priceWei.toString(),
          priceUsdcFormatted: newGateData.priceUsdc,
          unlockCount: 0,
          createdAt: Math.floor(Date.now() / 1000),
          active: true,
          isUnlocked: true,
          secretPayload: newGateData.secretPayload,
        };
        setGates([localGate, ...gates]);
        setStats((prev) => ({
          ...prev,
          totalGates: (parseInt(prev.totalGates) + 1).toString(),
        }));
      }

      setIsCreateOpen(false);
      showToast('Paywalled Gate published successfully on Arc!', 'success');
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || 'Creation failed', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendTip = async ({ recipient, amountUsdc, message }) => {
    setIsTipping(true);

    try {
      const tipWei = ethers.parseUnits(amountUsdc, 18);

      if (isContractConfigured) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.tipCreator(recipient, message, {
          value: tipWei,
        });

        showToast(`Tip broadcast on Arc: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
      } else {
        // Direct native send fallback if contract not deployed
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: recipient,
          value: tipWei,
        });
        showToast(`Direct USDC Tip sent: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
      }

      setIsTipOpen(false);
      showToast(`Sent ${amountUsdc} USDC tip directly to ${recipient.slice(0, 6)}...!`, 'success');
      confetti({ particleCount: 70, spread: 80 });
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || 'Tipping failed', 'error');
    } finally {
      setIsTipping(false);
    }
  };

  const handleOpenTipModalForCreator = (creatorAddress) => {
    setTipRecipient(creatorAddress);
    setIsTipOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/90 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onSwitchNetwork={switchNetwork}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Hero Section */}
        <section className="mb-10 text-center relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Circle Arc Microgrants Candidate</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">500 USDC Grant Track</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 max-w-4xl mx-auto leading-tight">
            Decoupled Micro-Monetization on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Circle's Arc Mainnet
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed">
            Lock exclusive links, research alpha, code repositories, or private communities behind instant 1-click native USDC micro-payments with sub-second finality.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Lock a Secret Link
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-600 transition-all"
            >
              Read Architecture & Guide
            </button>
          </div>
        </section>

        {/* Bento Grid Stats */}
        <StatsBento
          stats={stats}
          isConnected={Boolean(account)}
          isArcNetwork={chainId === ARC_MAINNET.chainId}
        />

        {/* Explore View or Quick Tip View */}
        {activeTab === 'explore' ? (
          <ExploreGates
            gates={gates}
            account={account}
            onUnlock={handleUnlock}
            onViewSecret={(gate) => setSelectedUnlockedGate(gate)}
            onTipCreator={handleOpenTipModalForCreator}
            unlockingId={unlockingId}
            isArcNetwork={chainId === ARC_MAINNET.chainId}
          />
        ) : (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-xl mx-auto text-center border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-500/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Instant P2P Micro-Tipping</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Send native USDC micro-tips with zero middleman take-rate directly over Arc Mainnet.
            </p>
            <button
              onClick={() => {
                setTipRecipient('');
                setIsTipOpen(true);
              }}
              className="px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-600/30 transition-all"
            >
              Open Micro-Tipping Terminal
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06080c] py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span>ArcGate • Built for DoraHacks Arc Microgrants (Circle)</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Chain ID: 5042</span>
            <span>RPC: rpc.mainnet.arc.io</span>
            <span>Native Gas: USDC</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateGateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateGate={handleCreateGate}
        isCreating={isCreating}
        isConnected={Boolean(account)}
        isArcNetwork={chainId === ARC_MAINNET.chainId}
      />

      <TipModal
        isOpen={isTipOpen}
        onClose={() => setIsTipOpen(false)}
        onSendTip={handleSendTip}
        isTipping={isTipping}
        initialRecipient={tipRecipient}
        isConnected={Boolean(account)}
        isArcNetwork={chainId === ARC_MAINNET.chainId}
      />

      <UnlockedModal
        isOpen={Boolean(selectedUnlockedGate)}
        onClose={() => setSelectedUnlockedGate(null)}
        gate={selectedUnlockedGate}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}
