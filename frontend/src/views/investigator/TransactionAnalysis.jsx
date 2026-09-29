import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, ShieldAlert, ArrowRight, FolderPlus, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';

export const TransactionAnalysis = () => {
  const { liveTransactions } = useWebSocket();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [escalationMsg, setEscalationMsg] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions({ limit: 100 });
      setTransactions(data);
      if (data.length > 0) setSelectedTx(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToInvestigation = async (txHash) => {
    try {
      const res = await api.sendToInvestigation({
        tx_hash: txHash,
        notes: `Escalated directly from Transaction Forensic Inspector`,
        priority: 'HIGH'
      });
      setEscalationMsg(`Case #${res.case_id} initialized with on-chain evidence hash!`);
      setTimeout(() => setEscalationMsg(''), 5000);
      loadTransactions();
    } catch (err) {
      alert(err.message || 'Escalation failed');
    }
  };

  const combinedList = [...liveTransactions, ...transactions.filter(t => !liveTransactions.some(lt => lt.tx_hash === t.tx_hash))];
  const filtered = combinedList.filter(t => {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Transaction Forensic Stream & Investigation Desk</h2>
          <p className="text-xs text-slate-400">Live multi-layer inference evaluating risk scores, confidence, and detection evidence</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterRisk === r ? 'bg-indigo-600 text-white' : 'bg-[#161c2b] text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {escalationMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold">{escalationMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Transaction Hash, Sender, Receiver, or Fraud Type..."
          className="w-full bg-[#111622] border border-[#1e2638] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transaction Table */}
        <div className="lg:col-span-7 bg-[#111622] border border-[#1e2638] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1e2638]">
              <tr>
                <th className="p-3">Tx Hash</th>
                <th className="p-3">Sender / Receiver</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638] text-slate-300">
              {filtered.slice(0, 15).map((tx, idx) => (
                <tr
                  key={tx.tx_hash || idx}
                  onClick={() => setSelectedTx(tx)}
                  className={`cursor-pointer transition ${selectedTx?.tx_hash === tx.tx_hash ? 'bg-[#1a2336]' : 'hover:bg-[#151c2c]'}`}
                >
                  <td className="p-3 font-mono text-indigo-400 font-semibold">{tx.tx_hash.slice(0, 10)}...</td>
                  <td className="p-3 font-mono text-[11px]">
                    <span className="text-slate-400">{tx.sender.slice(0, 6)}...</span> → <span className="text-white">{tx.receiver.slice(0, 6)}...</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-white">{tx.amount} {tx.currency || 'ETH'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.risk_score >= 71 ? 'bg-red-500/20 text-red-400' : tx.risk_score >= 31 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {tx.risk_score}/100
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 font-semibold">Inspect</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Transaction Inspector & Send to Investigation Action */}
        <div className="lg:col-span-5 bg-[#111622] border border-[#1e2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
            <h3 className="text-sm font-bold text-white">Forensic Telemetry Inspector</h3>
            {selectedTx && (
              <button
                onClick={() => handleSendToInvestigation(selectedTx.tx_hash)}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-3 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Send to Investigation
              </button>
            )}
          </div>

          {selectedTx ? (
            <div className="space-y-4 text-xs">
              <div className="bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                <span className="text-[10px] text-slate-500 block mb-1">Transaction Hash</span>
                <span className="font-mono text-indigo-300 break-all text-[11px] block">{selectedTx.tx_hash}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                  <span className="text-[10px] text-slate-500 block mb-1">Assessed Risk Score</span>
                  <span className={`text-xl font-bold font-mono ${selectedTx.risk_score >= 71 ? 'text-red-500' : selectedTx.risk_score >= 31 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {selectedTx.risk_score} / 100
                  </span>
                  <span className="text-[10px] text-slate-400 block">Confidence: {selectedTx.confidence || 92}%</span>
                </div>
                <div className="bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                  <span className="text-[10px] text-slate-500 block mb-1">Classification</span>
                  <span className="text-xs font-bold text-white block">{selectedTx.fraud_type || 'Standard Transfer'}</span>
                  <span className="text-[10px] text-amber-400 font-semibold block">{selectedTx.status}</span>
                </div>
              </div>

              <div className="bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Detailed Forensic Reasons (Why Flagged)</h4>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedTx.reasons && selectedTx.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Select a transaction to inspect telemetry</p>
          )}
        </div>
      </div>
    </div>
  );
};
