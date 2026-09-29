import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, ExternalLink, Plus, Search, Link2 } from 'lucide-react';
import { api } from '../../services/api';
import { BlockchainProofModal } from '../../components/BlockchainProofModal';

export const EvidenceManager = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);
  const [isProofOpen, setIsProofOpen] = useState(false);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    try {
      const data = await api.getEvidence();
      setEvidenceList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOnChain = async (evidenceId) => {
    try {
      const proof = await api.verifyEvidenceOnChain(evidenceId);
      setSelectedProof(proof);
      setIsProofOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Immutable Evidence Vault & Blockchain Audit</h2>
          <p className="text-xs text-slate-400">
            Court-admissible off-chain evidence hashes anchored to Ethereum Sepolia / EVM smart contract (CryptoShieldAudit.sol)
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111622] border border-[#1e2638] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1e2638]">
            <tr>
              <th className="p-3.5 font-medium">Evidence ID</th>
              <th className="p-3.5 font-medium">Linked Case</th>
              <th className="p-3.5 font-medium">Target Tx Hash</th>
              <th className="p-3.5 font-medium">Amount & Route</th>
              <th className="p-3.5 font-medium">SHA-256 Digest</th>
              <th className="p-3.5 font-medium">Blockchain Anchor</th>
              <th className="p-3.5 font-medium text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2638] text-slate-300">
            {evidenceList.map((ev) => (
              <tr key={ev.id} className="hover:bg-[#151c2c] transition">
                <td className="p-3.5 font-mono text-emerald-400 font-bold">{ev.evidence_id}</td>
                <td className="p-3.5 font-mono text-indigo-400 font-semibold">{ev.case_id}</td>
                <td className="p-3.5 font-mono text-slate-300">{ev.tx_hash.slice(0, 14)}...</td>
                <td className="p-3.5">
                  <span className="font-bold text-white block">{ev.amount}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{ev.from_wallet.slice(0, 6)}... → {ev.to_wallet.slice(0, 6)}...</span>
                </td>
                <td className="p-3.5 font-mono text-indigo-300 text-[11px]">{ev.evidence_hash.slice(0, 16)}...</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Sepolia Block #{ev.block_number || 18942084}</span>
                  </div>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleVerifyOnChain(ev.evidence_id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify Proof
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proof Modal */}
      <BlockchainProofModal
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        evidenceData={selectedProof}
      />
    </div>
  );
};
