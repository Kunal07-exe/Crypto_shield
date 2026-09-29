import React from 'react';
import { X, FileText, Printer, Download, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export const CaseReportModal = ({ isOpen, onClose, reportData }) => {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const cInfo = reportData.case_information || {};
  const pWallet = reportData.primary_wallet || {};
  const risk = reportData.risk_analysis || {};
  const moneyFlow = reportData.money_flow_analysis || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0e131f] border border-[#1e2638] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl text-slate-200">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-[#1e2638] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider">OFFICIAL INVESTIGATION DOSSIER</span>
              <h2 className="text-xl font-bold text-white">Case Report: {cInfo.case_id}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#1e2638] hover:bg-[#28334b] text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Body */}
        <div className="space-y-6 text-xs">
          {/* Case Info Grid */}
          <div className="bg-[#141a29] border border-[#1e2638] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">1. CASE INFORMATION</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block">Case Reference</span>
                <span className="text-white font-mono font-bold">{cInfo.case_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Date & Timestamp</span>
                <span className="text-white">{cInfo.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Lead Investigator</span>
                <span className="text-white font-semibold">{cInfo.investigator}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Status & Priority</span>
                <span className="text-amber-400 font-semibold">{cInfo.status} • {cInfo.priority}</span>
              </div>
            </div>
          </div>

          {/* Primary Target Wallet */}
          <div className="bg-[#141a29] border border-[#1e2638] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">2. PRIMARY WALLET INTELLIGENCE</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 block">Wallet Address</span>
                <span className="text-white font-mono font-bold break-all">{pWallet.address}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Assessed Risk Score</span>
                <span className="text-red-500 font-bold font-mono">{pWallet.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Entity Classification</span>
                <span className="text-white">{pWallet.wallet_type}</span>
              </div>
            </div>
          </div>

          {/* Risk Engine Findings */}
          <div className="bg-[#141a29] border border-[#1e2638] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">3. MULTI-LAYER RISK & ML ANALYSIS</h4>
            <div className="mb-3">
              <span className="text-slate-400">Primary Classification: </span>
              <span className="text-white font-bold">{risk.primary_classification}</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              {risk.reasons && risk.reasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Money Flow Analysis */}
          <div className="bg-[#141a29] border border-[#1e2638] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">4. MONEY FLOW & NETWORK TOPOLOGY</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Volume Traced</span>
                <span className="text-white font-bold font-mono">{moneyFlow.total_amount_traced}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Trace Depth Verified</span>
                <span className="text-white">{moneyFlow.trace_depth}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Identified Exit Nodes</span>
                <span className="text-blue-400 font-semibold">{moneyFlow.identified_exchanges?.join(', ') || 'Binance'}</span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-[#141a29] border border-[#1e2638] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">5. RECOMMENDED ACTIONS</h4>
            <ul className="space-y-1.5 text-slate-300">
              {reportData.recommended_action && reportData.recommended_action.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 border-t border-[#1e2638] pt-4 text-center text-[10px] text-slate-500 font-mono">
          PRODUCED BY CRYPTOSHIELD ENTERPRISE CYBERCRIME INTELLIGENCE SUITE • TAMPER-EVIDENT REPORT
        </div>
      </div>
    </div>
  );
};
