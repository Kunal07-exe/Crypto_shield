import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Filter, ShieldAlert, ArrowUpRight, ArrowDownLeft, ExternalLink, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export const UserTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions({ limit: 100 });
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchesRisk = filterRisk === 'ALL' || t.risk_level === filterRisk;
    const matchesSearch = !searchQuery || 
      t.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fraud_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Wallet Transactions & Ledger History</h2>
          <p className="text-xs text-slate-500">Full verified on-chain history with real-time risk scores and security badges</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tx Hash, Counterparty Address, or Label..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Risk Filter:</span>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterRisk(lvl)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterRisk === lvl
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-bold">Type</th>
              <th className="p-3.5 font-bold">Tx Hash</th>
              <th className="p-3.5 font-bold">Counterparty</th>
              <th className="p-3.5 font-bold">Amount</th>
              <th className="p-3.5 font-bold">Risk Assessment</th>
              <th className="p-3.5 font-bold">Classification</th>
              <th className="p-3.5 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((tx, idx) => {
              const isSent = tx.sender.toLowerCase().includes('0x82a91');
              return (
                <tr key={tx.tx_hash || idx} className="hover:bg-slate-50 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSent ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {isSent ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold">{isSent ? 'Outgoing' : 'Incoming'}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-indigo-600 font-semibold">{tx.tx_hash.slice(0, 14)}...</td>
                  <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                    {isSent ? tx.receiver.slice(0, 10) + '...' : tx.sender.slice(0, 10) + '...'}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {isSent ? `-${tx.amount}` : `+${tx.amount}`} {tx.currency || 'ETH'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.risk_score >= 71 ? 'bg-red-100 text-red-700' : (tx.risk_score >= 31 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                    }`}>
                      {tx.risk_score}/100 {tx.risk_level}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{tx.fraud_type}</td>
                  <td className="p-3.5 text-right">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                      Confirmed
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
