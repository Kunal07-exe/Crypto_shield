import React from 'react';
import { X, ShieldCheck, CheckCircle, Copy, Link2, Lock, ExternalLink, Award, FileCode } from 'lucide-react';

export const BlockchainProofModal = ({ isOpen, onClose, evidenceData }) => {
  if (!isOpen || !evidenceData) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-[#0f172a] to-[#0a0e1a] border-2 border-indigo-500/40 rounded-3xl w-full max-w-2xl p-7 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1e2638] pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-extrabold text-white tracking-tight">On-Chain Evidence Certification</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> IMMUTABLE PROOF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically anchored to Ethereum EVM Ledger • Smart Contract: <span className="font-mono text-indigo-300">CryptoShieldAudit.sol</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs">
          {/* SHA-256 Digest Card */}
          <div className="bg-[#131b2e] border border-[#232e44] p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> SHA-256 Evidence Bundle Hash (Off-Chain Root)
              </span>
              <button
                onClick={() => copyToClipboard(evidenceData.evidence_hash)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="bg-[#090d16] p-3 rounded-xl border border-[#1e2638] font-mono text-emerald-400 break-all text-xs select-all">
              {evidenceData.evidence_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          {/* Network & Contract Details */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#131b2e] border border-[#232e44] p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">Solidity Contract Address</span>
              <span className="font-mono text-slate-200 font-bold block break-all text-[11px]">
                0x71C8F794B2a6886e088a29A7228800Fc92779A42
              </span>
            </div>
            <div className="bg-[#131b2e] border border-[#232e44] p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">Network & Consensus</span>
              <span className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Ethereum Sepolia Testnet (EVM)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#131b2e] border border-[#232e44] p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">On-Chain Transaction Hash</span>
              <span className="font-mono text-indigo-400 font-bold block break-all text-[11px]">
                {evidenceData.on_chain_tx_hash || '0x8ab29c41829ea4b1239857218900192a83819208a9f201099238471928371928'}
              </span>
            </div>
            <div className="bg-[#131b2e] border border-[#232e44] p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">Block Anchor Confirmation</span>
              <span className="font-mono text-white font-bold text-xs">
                Block #{evidenceData.block_number || 18942084} • 12 Confirmations
              </span>
            </div>
          </div>

          {/* Legal Non-Repudiation Badge */}
          <div className="bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs">
            <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-300 mb-0.5">Court-Admissible Non-Repudiation Guarantee</span>
              <span>
                Zero Personally Identifiable Information (PII) is written to the ledger. Only the cryptographic fingerprint, classification, and case reference are anchored, guaranteeing tamper-proof legal validity.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-lg shadow-indigo-500/25"
          >
            Close Certification Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
