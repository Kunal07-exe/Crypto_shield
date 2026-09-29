import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Search,
  FileText,
  ShieldCheck,
  ArrowRight,
  GitFork,
  Activity,
  Award,
  AlertTriangle,
  FolderPlus,
  Lock,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { CaseReportModal } from '../../components/CaseReportModal';
import { BlockchainProofModal } from '../../components/BlockchainProofModal';
import { FollowMoneyModal } from '../../components/FollowMoneyModal';

export const InvestigationHub = () => {
  const [cases, setCases] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Escalate Tx
  const [txHashToEscalate, setTxHashToEscalate] = useState('');
  const [escalatePriority, setEscalatePriority] = useState('HIGH');
  const [escalateNotes, setEscalateNotes] = useState('');
  const [escalateMsg, setEscalateMsg] = useState('');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [isFollowMoneyOpen, setIsFollowMoneyOpen] = useState(false);
  const [followTarget, setFollowTarget] = useState('0x71C8F794B2a6886e088a29A7228800Fc92779A42');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cData, eData] = await Promise.all([
        api.getCases(),
        api.getEvidence()
      ]);
      setCases(cData);
      setEvidenceList(eData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalateTx = async (e) => {
    e.preventDefault();
    if (!txHashToEscalate) return;
    try {
      const res = await api.sendToInvestigation({
        tx_hash: txHashToEscalate.trim(),
        priority: escalatePriority,
        notes: escalateNotes || 'Escalated via Investigation Hub Command Center'
      });
      setEscalateMsg(`Success! Initialized Case #${res.case_id} anchored on Ethereum Sepolia.`);
      setTxHashToEscalate('');
      setEscalateNotes('');
      loadData();
      setTimeout(() => setEscalateMsg(''), 6000);
    } catch (err) {
      alert(err.message || 'Escalation failed');
    }
  };

  const handleOpenReport = async (caseId) => {
    const rep = await api.getCaseReport(caseId);
    setSelectedReport(rep);
    setIsReportOpen(true);
  };

  const handleVerifyProof = async (evidenceId) => {
    const proof = await api.verifyEvidenceOnChain(evidenceId);
    setSelectedProof(proof);
    setIsProofOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Investigation Command & Forensic Dossier Hub</h2>
          <p className="text-xs text-slate-400">
            Escalate suspect transactions to formal legal cases, anchor SHA-256 evidence digests, and inspect court-ready dossiers.
          </p>
        </div>
      </div>

      {escalateMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{escalateMsg}</span>
        </div>
      )}

      {/* Escalate Transaction to Investigation Card */}
      <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 text-indigo-400">
          <FolderPlus className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">Send Transaction for Investigation</h3>
        </div>

        <form onSubmit={handleEscalateTx} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 font-semibold">Target Transaction Hash</label>
            <input
              type="text"
              required
              value={txHashToEscalate}
              onChange={(e) => setTxHashToEscalate(e.target.value)}
              placeholder="0x8ab29c41..."
              className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Case Priority</label>
            <select
              value={escalatePriority}
              onChange={(e) => setEscalatePriority(e.target.value)}
              className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" /> Escalate & Anchor Proof
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Active Cases with Dossiers & Evidence Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Cases Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#111622] border border-[#1e2638] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Active Case Dossiers</h3>
            <span className="text-xs text-indigo-400 font-mono font-semibold">{cases.length} Cases Active</span>
          </div>

          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="bg-[#161c2b] border border-[#232e44] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-indigo-400">{c.case_id}</span>
                    <span className="text-white font-semibold">{c.title}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Target: <span className="font-mono text-slate-300">{c.primary_wallet}</span> • {c.fraud_type}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold ${c.risk_score >= 71 ? 'text-red-500' : 'text-amber-500'}`}>
                    {c.risk_score}/100
                  </span>
                  <button
                    onClick={() => handleOpenReport(c.case_id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold transition"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Vault (5 cols) */}
        <div className="lg:col-span-5 bg-[#111622] border border-[#1e2638] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">On-Chain Evidence Vault</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                Solidity EVM Verified
              </span>
            </div>

            <div className="space-y-3">
              {evidenceList.slice(0, 4).map((ev) => (
                <div key={ev.id} className="bg-[#161c2b] border border-[#232e44] p-3.5 rounded-2xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-400 block">{ev.evidence_id}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">SHA: {ev.evidence_hash.slice(0, 16)}...</span>
                  </div>
                  <button
                    onClick={() => handleVerifyProof(ev.evidence_id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify Proof
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e2638] text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Contract: 0x71C8F794...9A42 (Sepolia)</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CaseReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={selectedReport}
      />

      <BlockchainProofModal
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        evidenceData={selectedProof}
      />
    </div>
  );
};
