import React from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const PreTxWarningModal = ({
  isOpen,
  onClose,
  onProceed,
  amount = '0.82',
  currency = 'ETH',
  fiatValue = '₹2,35,000',
  recipient = '0x71A829384729182a0b1239847192837192837192',
  riskScore = 91,
  reasons = [
    'Address reported in 14 fraud reports',
    'Connected to known scam wallets',
    'Suspicious fund movement detected',
    'Interacts with high risk exchange'
  ]
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-red-100 flex flex-col">
        {/* Header */}
        <div className="p-4 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wide">TRANSACTION WARNING</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 pt-3 flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 mb-1">You are about to send</span>
          
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {amount} {currency}
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-4">
            ≈ {fiatValue}
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-left">
            <span className="text-[11px] text-slate-400 block mb-0.5">To</span>
            <div className="font-mono text-xs font-bold text-slate-800 break-all">
              {recipient.slice(0, 8)}...{recipient.slice(-6)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Risk Score:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-red-600 font-mono">{riskScore} / 100</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  HIGH RISK
                </span>
              </div>
            </div>
          </div>

          {/* Why is this risky? */}
          <div className="w-full text-left mb-6">
            <h4 className="text-xs font-bold text-red-600 mb-2">Why is this risky?</h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              Cancel Transaction
            </button>
            <button
              onClick={onProceed}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-md shadow-red-500/20"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
