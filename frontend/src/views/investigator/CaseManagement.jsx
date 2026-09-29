import React, { useState, useEffect } from 'react';
import { FolderLock, Plus, RefreshCw, Search, CheckCircle, Clock, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { CaseReportModal } from '../../components/CaseReportModal';

export const CaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [creatingCase, setCreatingCase] = useState(false);

  const [newCase, setNewCase] = useState({
    title: '',
    subject: '',
    primary_wallet: '',
    victim_wallet: '',
    suspect_wallet: '',
    priority: 'HIGH',
    fraud_type: 'Investment Scam',
    amount_lost: '₹4,75,000',
    notes: ''
  });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = async (caseId) => {
    try {
      const rep = await api.getCaseReport(caseId);
      setSelectedReport(rep);
      setIsReportOpen(true);
    } catch (e) {
      alert('Failed to load dossier: ' + e.message);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    setCreatingCase(true);
    try {
      await api.createCase(newCase);
      setCreateMsg('Case created successfully!');
      setShowCreate(false);
      setNewCase({ title: '', subject: '', primary_wallet: '', victim_wallet: '', suspect_wallet: '', priority: 'HIGH', fraud_type: 'Investment Scam', amount_lost: '₹4,75,000', notes: '' });
      await loadCases();
    } catch (err) {
      setCreateMsg('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingCase(false);
      setTimeout(() => setCreateMsg(''), 4000);
    }
  };

  const filtered = cases.filter(c => {
    const matchSearch = !searchQuery ||
      c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primary_wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fraud_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchPriority = filterPriority === 'ALL' || c.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const statusColor = (s) => {
    if (s === 'Under Investigation') return 'bg-indigo-500/10 text-indigo-400';
    if (s === 'High Risk') return 'bg-red-500/10 text-red-400';
    if (s === 'Pending Review') return 'bg-amber-500/10 text-amber-400';
    if (s === 'Resolved') return 'bg-emerald-500/10 text-emerald-400';
    return 'bg-slate-500/10 text-slate-400';
  };

  const priorityColor = (p) => {
    if (p === 'CRITICAL') return 'text-red-500';
    if (p === 'HIGH') return 'text-amber-500';
    if (p === 'MEDIUM') return 'text-blue-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Case Management</h2>
          <p className="text-xs text-slate-400">Active investigation ledger · {cases.length} total cases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadCases} className="bg-[#161c2b] border border-[#1e2638] text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition font-semibold shadow-lg shadow-indigo-500/20">
            <Plus className="w-3.5 h-3.5" /> New Case
          </button>
        </div>
      </div>

      {createMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {createMsg}
        </div>
      )}

      {/* Create Case Form */}
      {showCreate && (
        <div className="bg-[#111622] border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Open New Investigation Case</h3>
          <form onSubmit={handleCreateCase} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Case Title</label>
              <input required value={newCase.title} onChange={e => setNewCase(p => ({...p, title: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Investment Scam Investigation - Batch 3" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Primary Suspect Wallet</label>
              <input required value={newCase.primary_wallet} onChange={e => setNewCase(p => ({...p, primary_wallet: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="0x..." />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Victim Wallet (Optional)</label>
              <input value={newCase.victim_wallet} onChange={e => setNewCase(p => ({...p, victim_wallet: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="0x..." />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Fraud Type</label>
              <select value={newCase.fraud_type} onChange={e => setNewCase(p => ({...p, fraud_type: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option>Investment Scam</option>
                <option>Wallet Drainer + Phishing Vector</option>
                <option>Address Poisoning Attack</option>
                <option>Mule Wallet + Layering Pattern</option>
                <option>Smart Contract Exploit</option>
                <option>Romance Fraud</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Priority</label>
              <select value={newCase.priority} onChange={e => setNewCase(p => ({...p, priority: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Amount Involved</label>
              <input value={newCase.amount_lost} onChange={e => setNewCase(p => ({...p, amount_lost: e.target.value}))} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="₹4,75,000 or 2.4 ETH" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Case Notes</label>
              <textarea value={newCase.notes} onChange={e => setNewCase(p => ({...p, notes: e.target.value}))} rows={2} className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Initial investigation context and findings..." />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="bg-[#161c2b] text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs transition">Cancel</button>
              <button type="submit" disabled={creatingCase} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2">
                {creatingCase ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Case
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search case ID, subject, wallet, or fraud type..."
            className="w-full bg-[#111622] border border-[#1e2638] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Status:</span>
          {['ALL', 'Under Investigation', 'Pending Review', 'High Risk', 'Resolved'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 py-1.5 rounded-lg transition font-medium ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-[#161c2b] text-slate-400 hover:text-white'}`}>
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)} className={`px-2.5 py-1.5 rounded-lg transition font-medium ${filterPriority === p ? 'bg-indigo-600 text-white' : 'bg-[#161c2b] text-slate-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-[#111622] border border-[#1e2638] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1e2638]">
            <tr>
              <th className="p-3.5 font-bold">Case ID</th>
              <th className="p-3.5 font-bold">Title / Subject</th>
              <th className="p-3.5 font-bold">Risk</th>
              <th className="p-3.5 font-bold">Priority</th>
              <th className="p-3.5 font-bold">Fraud Type</th>
              <th className="p-3.5 font-bold">Status</th>
              <th className="p-3.5 font-bold">Amount</th>
              <th className="p-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2638]">
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-slate-500">Loading cases...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-slate-500">No cases match your current filters.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-[#151c2c] transition text-slate-300">
                  <td className="p-3 font-mono font-bold text-indigo-400">{c.case_id}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white truncate max-w-[160px]">{c.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{c.primary_wallet.slice(0, 10)}...</div>
                  </td>
                  <td className="p-3">
                    <span className={`font-mono font-bold ${c.risk_score >= 71 ? 'text-red-500' : c.risk_score >= 31 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {c.risk_score}/100
                    </span>
                  </td>
                  <td className={`p-3 font-bold ${priorityColor(c.priority)}`}>{c.priority}</td>
                  <td className="p-3 text-slate-400">{c.fraud_type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-mono">{c.amount_lost}</td>
                  <td className="p-3 text-right flex gap-1.5 justify-end">
                    <button onClick={() => handleOpenDossier(c.case_id)} className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition">
                      Dossier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CaseReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={selectedReport}
      />
    </div>
  );
};
