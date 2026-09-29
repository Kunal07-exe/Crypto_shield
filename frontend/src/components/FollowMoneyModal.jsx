import React, { useState } from 'react';
import { X, Search, GitFork, ArrowRight, Clock, ShieldCheck, Zap, Database } from 'lucide-react';
import { api } from '../services/api';

export const FollowMoneyModal = ({ isOpen, onClose, initialAddress = '0x71C8F794B2a6886e088a29A7228800Fc92779A42' }) => {
  const [address, setAddress] = useState(initialAddress);
  const [hops, setHops] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTrace = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await api.followTheMoney({
        start_wallet: address,
        max_hops: parseInt(hops),
        min_amount: 0.0
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0f1420] border border-[#1e2638] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-7 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2638] pb-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Follow the Money — Multi-Hop Fund Tracker</h2>
              <p className="text-xs text-slate-400">Deep recursive graph traversal tracing addresses, mixers, peel chains, and exchange exits</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#161c2b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1 font-medium">Target Address / Transaction Seed</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Trace Depth (1 to 10 Hops)</label>
            <select
              value={hops}
              onChange={(e) => setHops(e.target.value)}
              className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(h => (
                <option key={h} value={h}>{h} {h === 1 ? 'Hop' : 'Hops'}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTrace}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
              Execute Multi-Hop Trace
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Total Traced</span>
                <span className="text-base font-bold text-white font-mono">{result.total_amount_traced_eth} ETH</span>
              </div>
              <div className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Wallets Involved</span>
                <span className="text-base font-bold text-indigo-400 font-mono">{result.wallets_involved_count}</span>
              </div>
              <div className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">High Risk Hops</span>
                <span className="text-base font-bold text-red-500 font-mono">{result.high_risk_wallets_count}</span>
              </div>
              <div className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Exchanges Reached</span>
                <span className="text-base font-bold text-blue-400 font-mono">{result.exchanges_reached.length || '1'}</span>
              </div>
              <div className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Trace Depth</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{result.max_hops_requested} Hops</span>
              </div>
            </div>

            {/* Timeline with detailed hop breakdown */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Hop Telemetry & Chronological Path
              </h3>
              <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#1e2638]">
                {result.timeline && result.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-10">
                    <div className={`absolute left-2.5 top-2.5 w-3.5 h-3.5 rounded-full border-2 bg-[#0f1420] ${
                      step.risk >= 71 ? 'border-red-500' : 'border-amber-400'
                    }`}></div>
                    
                    <div className="bg-[#161c2b] border border-[#232e44] rounded-2xl p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-400 font-mono">Hop #{step.hop}</span>
                          <span className="text-xs text-slate-400">• {step.timestamp}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            step.risk >= 71 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            Risk: {step.risk}/100
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {step.hop_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-1">
                          <span className="text-slate-400">{step.from}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-white font-bold">{step.to}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-center">
                        <span className="text-sm font-bold text-emerald-400 font-mono">+{step.amount_eth} ETH</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">Tx: {step.tx_hash ? step.tx_hash.slice(0, 16) + '...' : ''}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Block #{step.block_number}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
