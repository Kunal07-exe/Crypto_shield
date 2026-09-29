import React, { useState, useEffect } from 'react';
import { Wallet, Search, RefreshCw, Shield, AlertTriangle, TrendingUp, GitFork, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { FollowMoneyModal } from '../../components/FollowMoneyModal';

export const WalletIntelligence = ({ initialAddress }) => {
  const DEFAULT_ADDR = '0x71C8F794B2a6886e088a29A7228800Fc92779A42';
  const [address, setAddress] = useState(initialAddress || DEFAULT_ADDR);
  const [inputAddr, setInputAddr] = useState(initialAddress || DEFAULT_ADDR);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFollowOpen, setIsFollowOpen] = useState(false);

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      setInputAddr(initialAddress);
      loadProfile(initialAddress);
    } else {
      loadProfile(DEFAULT_ADDR);
    }
  }, [initialAddress]);

  const loadProfile = async (addr) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWalletProfile(addr || address);
      setProfile(data);
    } catch (e) {
      setError(e.message || 'Failed to load wallet profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputAddr.trim()) return;
    setAddress(inputAddr.trim());
    loadProfile(inputAddr.trim());
  };

  const w = profile?.wallet;
  const behavioral = profile?.behavioral_baseline;
  const recentTxs = profile?.recent_transactions || [];

  const getRiskColor = (score) => score >= 71 ? '#ef4444' : score >= 31 ? '#f59e0b' : '#10b981';
  const getRiskLabel = (score) => score >= 71 ? 'HIGH RISK' : score >= 31 ? 'MEDIUM RISK' : 'LOW RISK';
  const getRiskBg = (score) => score >= 71 ? 'bg-red-500/10 text-red-400 border-red-500/20' : score >= 31 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Wallet Intelligence & Behavioral Profiling</h2>
          <p className="text-xs text-slate-400">Deep forensic analysis linked across all 6 detection engine layers</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={inputAddr}
            onChange={(e) => setInputAddr(e.target.value)}
            placeholder="Enter wallet address (0x...) to investigate..."
            className="w-full bg-[#111622] border border-[#1e2638] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-500/20">
          <Shield className="w-4 h-4" /> Analyze Wallet
        </button>
        <button type="button" onClick={() => loadProfile(address)} className="bg-[#111622] border border-[#1e2638] text-slate-400 hover:text-white px-3 py-2.5 rounded-xl transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Analyzing blockchain footprint...
        </div>
      ) : profile && w ? (
        <div className="space-y-5">
          {/* Top Wallet Identity Row */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-5 flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              {/* Risk Score Gauge */}
              <div className="w-20 h-20 relative flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e2638" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getRiskColor(w.risk_score)} strokeWidth="3" strokeDasharray={`${w.risk_score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-extrabold font-mono text-white">{w.risk_score}</span>
                  <span className="text-[8px] text-slate-400">/100</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-white font-bold text-sm">{w.address.slice(0, 10)}...{w.address.slice(-8)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBg(w.risk_score)}`}>
                    {getRiskLabel(w.risk_score)}
                  </span>
                  {w.is_monitored && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      MONITORED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                  <span className="font-semibold text-slate-300">{w.blockchain}</span>
                  <span>·</span>
                  <span>{w.wallet_type}</span>
                  <span>·</span>
                  <span>Active {w.wallet_age_days}d</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {(w.tags || []).map((tag, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2638] text-slate-400 font-semibold uppercase">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsFollowOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                <GitFork className="w-3.5 h-3.5" /> Follow Money
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Balance', value: `${w.balance_eth.toFixed(4)} ETH`, sub: `≈ ₹${Math.round(w.balance_eth * 262000).toLocaleString('en-IN')}` },
              { label: 'Total Transactions', value: w.total_tx_count.toLocaleString(), sub: `${w.incoming_tx_count} in · ${w.outgoing_tx_count} out` },
              { label: 'Total Received', value: `${w.total_received_eth.toFixed(2)} ETH`, sub: 'Lifetime inflows' },
              { label: 'Total Sent', value: `${w.total_sent_eth.toFixed(2)} ETH`, sub: 'Lifetime outflows' },
              { label: 'Avg Tx Amount', value: `${(w.avg_tx_amount_eth || 0).toFixed(4)} ETH`, sub: 'Per-transaction average' },
              { label: 'Tx Velocity', value: `${(w.tx_velocity_per_hour || 0).toFixed(1)}/hr`, sub: 'Hourly activity rate' },
              { label: 'Scam Connections', value: w.known_scam_connections, sub: 'Known malicious links' },
              { label: 'Exchange Links', value: w.known_exchange_connections, sub: 'Centralized exits' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#111622] border border-[#1e2638] p-4 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">{stat.label}</span>
                <span className="text-sm font-bold text-white font-mono block">{stat.value}</span>
                <span className="text-[10px] text-slate-500">{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* Behavioral Profile */}
          {behavioral && (
            <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Behavioral Baseline Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Normal Activity Rate</span>
                  <span className="text-slate-200 font-semibold">{behavioral.normal_tx_per_day}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Avg Transaction Amount</span>
                  <span className="text-slate-200 font-semibold">{behavioral.normal_avg_amount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Active Window (UTC)</span>
                  <span className="text-slate-200 font-semibold">{behavioral.active_window}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Deviation Status</span>
                  <span className={`font-bold ${behavioral.deviation_status.includes('anomaly') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {behavioral.deviation_status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {recentTxs.length > 0 && (
            <div className="bg-[#111622] border border-[#1e2638] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#1e2638]">
                <h3 className="text-sm font-bold text-white">On-Chain Transaction History</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1e2638]">
                  <tr>
                    <th className="p-3">Tx Hash</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3">Counterparty</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638] text-slate-300">
                  {recentTxs.map((tx, i) => {
                    const isSent = tx.sender.toLowerCase() === w.address.toLowerCase();
                    return (
                      <tr key={tx.tx_hash || i} className="hover:bg-[#151c2c]">
                        <td className="p-3 font-mono text-indigo-400 font-semibold">{tx.tx_hash.slice(0, 12)}...</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSent ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isSent ? 'OUT' : 'IN'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300 text-[11px]">
                          {isSent ? tx.receiver.slice(0, 10) + '...' : tx.sender.slice(0, 10) + '...'}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{tx.amount} {tx.currency || 'ETH'}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            tx.risk_score >= 71 ? 'bg-red-500/20 text-red-400' : tx.risk_score >= 31 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {tx.risk_score}/100
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{tx.fraud_type}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-16 text-slate-500 text-xs">
          Enter a wallet address above to begin forensic analysis.
        </div>
      )}

      <FollowMoneyModal
        isOpen={isFollowOpen}
        onClose={() => setIsFollowOpen(false)}
        initialAddress={address}
      />
    </div>
  );
};
