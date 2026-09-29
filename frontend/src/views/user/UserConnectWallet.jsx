import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Shield, Wallet, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const UserConnectWallet = () => {
  const { loginWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customAddress, setCustomAddress] = useState('0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3');

  const handleConnect = async (provider = 'MetaMask') => {
    setLoading(true);
    try {
      const res = await api.walletLogin({
        wallet_address: customAddress,
        wallet_provider: provider
      });
      loginWallet(res.user, res.access_token);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-3">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 10.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">CryptoShield</h1>
          <span className="text-xs font-semibold text-emerald-600">Protect Your Crypto</span>
          <h2 className="text-base font-bold text-slate-900 mt-3">Connect Your Wallet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Securely connect your wallet to analyze risk and protect your assets.
          </p>
        </div>

        {/* Wallet Address Input for Testing */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">Active Wallet Address</label>
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Connect Buttons (Matching Screenshot) */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleConnect('MetaMask')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-500 font-bold text-base">🦊</span>
              <span>Connect MetaMask</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => handleConnect('WalletConnect')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-blue-500 font-bold text-base">⚡</span>
              <span>WalletConnect</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => handleConnect('Coinbase Wallet')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-blue-600 font-bold text-base">🔵</span>
              <span>Coinbase Wallet</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => handleConnect('Extensible Hardware Connector')}
            disabled={loading}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium py-2.5 px-4 rounded-xl text-xs transition text-center"
          >
            More Options
          </button>
        </div>

        {/* Security Guarantee Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>We never store your private keys or access to your funds.</span>
        </div>
      </div>
    </div>
  );
};
