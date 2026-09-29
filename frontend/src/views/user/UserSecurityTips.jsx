import React from 'react';
import { ShieldCheck, AlertTriangle, KeyRound, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

export const UserSecurityTips = () => {
  const tips = [
    {
      title: 'How to Prevent Address Poisoning Attacks',
      desc: 'Attackers generate vanity addresses mimicking the first 5 and last 4 characters of your frequent contacts and send tiny $0 transfers to pollute your transaction history. Always verify the full address or use an address book rather than copying from recent activity.',
      severity: 'HIGH RISK THREAT'
    },
    {
      title: 'Never Share Your Seed Phrase or Private Keys',
      desc: 'Legitimate platforms like CryptoShield, exchanges, and wallet software will NEVER ask for your 12/24-word secret recovery phrase. Private keys must remain strictly in hardware or local secure enclaves.',
      severity: 'CRITICAL RULE'
    },
    {
      title: 'Audit & Revoke Unlimited ERC-20 Token Approvals',
      desc: 'Malicious drainer dApps often trick users into signing unconstrained token spend approvals (uint256 max). Periodically review and revoke unneeded token permissions on trusted verification portals.',
      severity: 'DRAINER DEFENSE'
    },
    {
      title: 'Beware of High-Yield Telegram/Discord Staking Schemes',
      desc: 'Investment scams and romance fraud ("pig-butchering") promise unrealistic 100%+ guaranteed weekly returns. Remember that once funds leave your wallet on-chain, transactions cannot be reversed without law enforcement intervention.',
      severity: 'SCAM WARNING'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Cryptocurrency Security & Fraud Prevention Guide</h2>
            <p className="text-xs text-slate-500">Essential rules and proactive countermeasures to protect your web3 assets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((t, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider inline-block mb-2">
                  {t.severity}
                </span>
                <h3 className="text-xs font-bold text-slate-900 mb-2">{t.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
