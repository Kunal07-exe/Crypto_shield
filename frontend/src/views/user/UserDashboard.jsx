import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowDownLeft, ArrowUpRight, AlertTriangle, Send, Bell, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { PreTxWarningModal } from '../../components/PreTxWarningModal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_WALLET = '0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3';

export const UserDashboard = ({ onNavigateToReport }) => {
  const { user } = useAuth();
  const MY_WALLET = user?.wallet_address || DEFAULT_WALLET;
  const [walletProfile, setWalletProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Send Payment Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState('0.20');
  const [recipient, setRecipient] = useState('0x71C8F794B2a6886e088a29A7228800Fc92779A42');
  const [isExecuting, setIsExecuting] = useState(false);

  // Risk Warning Modal State
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningData, setWarningData] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getWalletProfile(MY_WALLET);
      setWalletProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSend = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    try {
      // 1. Pre-check risk
      const check = await api.preCheckTransaction({
        sender: MY_WALLET,
        recipient: recipient.trim(),
        amount: parseFloat(sendAmount),
        currency: 'ETH',
        blockchain: 'Ethereum'
      });

      if (check.is_dangerous || check.risk_score >= 71) {
        setWarningData(check);
        setIsWarningOpen(true);
        setIsExecuting(false);
      } else {
        // Safe to execute directly
        await executeTransfer(false);
      }
    } catch (err) {
      alert(err.message || 'Transaction check failed');
      setIsExecuting(false);
    }
  };

  const executeTransfer = async (forceProceed = false) => {
    setIsExecuting(true);
    try {
      const res = await api.executePayment({
        sender_wallet: MY_WALLET,
        recipient_wallet: recipient.trim(),
        amount: parseFloat(sendAmount),
        currency: 'ETH',
        force_proceed: forceProceed
      });

      setIsWarningOpen(false);
      setIsSendModalOpen(false);
      setPaymentSuccessMsg(`Payment of ${sendAmount} ETH successfully broadcasted! Tx Hash: ${res.tx_hash.slice(0, 16)}...`);
      setTimeout(() => setPaymentSuccessMsg(''), 6000);
      
      // Reload profile to reflect deducted balance & updated security score
      await loadProfile();
    } catch (err) {
      alert(err.message || 'Payment execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const w = walletProfile?.wallet;
  const balance = w?.balance_eth ?? 2.45;
  const securityScore = w?.security_score ?? 82;
  const securityLabel = w?.security_label ?? 'LOW RISK';
  const recentTxs = walletProfile?.recent_transactions || [];

  return (
    <div className="space-y-6">
      {/* Top Wallet Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-mono font-bold text-xs">
            0x
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 text-sm">0x82A...91F3</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Verified
              </span>
            </div>
            <span className="text-xs text-slate-500">Connected via MetaMask (Ethereum Mainnet)</span>
          </div>
        </div>

        {/* Transfer Button */}
        <button
          onClick={() => setIsSendModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-emerald-500/20"
        >
          <Send className="w-3.5 h-3.5" /> Send Crypto / Transfer
        </button>
      </div>

      {paymentSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Top 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Security Score Card (Dynamic) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-600">Wallet Security Score</span>
          
          <div className="flex items-center gap-4 my-2">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={securityScore >= 75 ? '#10b981' : (securityScore >= 40 ? '#f59e0b' : '#ef4444')}
                  strokeWidth="3.5"
                  strokeDasharray={`${securityScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-slate-800 font-mono">{securityScore}</span>
                <span className="text-[8px] font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            <div>
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                securityScore >= 75 ? 'text-emerald-600' : (securityScore >= 40 ? 'text-amber-600' : 'text-red-600')
              }`}>
                {securityLabel}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {securityScore >= 75 ? 'Your wallet is safe from active drainers' : 'Caution: Recent interaction with risky counterparties'}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Calculated from {w?.total_tx_count || 284} previous transactions</span>
          </div>
        </div>

        {/* Total Balance Card (Dynamic) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Balance</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Live
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{balance.toFixed(4)} ETH</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              ≈ ₹{Math.round(balance * 262000).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="h-8 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M 0,18 Q 25,5 50,15 T 100,6" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-600">Total Transactions</span>
          
          <div className="my-2">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{w?.total_tx_count || 284}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">All time ledger entries</div>
          </div>

          <div className="h-8 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M 0,20 Q 30,12 60,18 T 100,5" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions vs Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions List (Dynamic) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
            <span className="text-xs text-slate-500">{recentTxs.length} Recorded</span>
          </div>

          <div className="space-y-3">
            {recentTxs.slice(0, 4).map((tx, idx) => {
              const isSent = tx.sender.toLowerCase().includes('0x82a91');
              return (
                <div key={tx.tx_hash || idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSent ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isSent ? `To: ${tx.receiver.slice(0, 8)}...` : `From: ${tx.sender.slice(0, 8)}...`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono block ${isSent ? 'text-slate-800' : 'text-emerald-600'}`}>
                      {isSent ? `-${tx.amount} ETH` : `+${tx.amount} ETH`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Risk Alerts</h3>
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">Active Protection</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900">High Risk Address Intercepted</span>
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Pre-transaction monitor actively intercepting drainer <span className="font-mono font-semibold">0x71C...9A42</span>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">Address Dusting Attempt</span>
                    <span className="text-[10px] text-slate-400">Blocked</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Address Poisoning vanity dusting simulation neutralized.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Suspect fraud?</span>
            <button onClick={onNavigateToReport} className="text-emerald-700 font-bold hover:underline">
              Report Incident →
            </button>
          </div>
        </div>
      </div>

      {/* Send Payment Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Send Cryptocurrency</h3>
              <button onClick={() => setIsSendModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Recipient Address</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Try default suspicious address 0x71C... to view the Pre-Transaction Risk Interceptor.
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (ETH)</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-l-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 px-4 py-3 rounded-r-xl font-bold font-mono text-slate-700">
                    ETH
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available Balance: {balance.toFixed(4)} ETH
                </span>
              </div>

              <button
                type="submit"
                disabled={isExecuting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isExecuting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
                Analyze Risk & Proceed
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Transaction Warning Modal */}
      <PreTxWarningModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        onProceed={() => executeTransfer(true)}
        amount={sendAmount}
        currency="ETH"
        fiatValue={`₹${Math.round(parseFloat(sendAmount || 0) * 262000).toLocaleString('en-IN')}`}
        recipient={recipient}
        riskScore={warningData?.risk_score || 91}
        reasons={warningData?.reasons || [
          'Address reported in 14 fraud reports',
          'Connected to known scam wallets',
          'Suspicious fund movement detected',
          'Interacts with high risk exchange'
        ]}
      />
    </div>
  );
};
