import React, { useState, useEffect } from 'react';
import { FileWarning, CheckCircle2, AlertCircle, Send, FileText, Plus, ShieldCheck, Clock, Layers } from 'lucide-react';
import { api } from '../../services/api';

export const UserReportFraud = ({ defaultTab = 'file' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'file' or 'my_reports'
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Form State
  const [targetAddress, setTargetAddress] = useState('0x71C8F794B2a6886e088a29A7228800Fc92779A42');
  const [fraudType, setFraudType] = useState('Investment Scam / Ponzi');
  const [amountLost, setAmountLost] = useState('2.4');
  const [currency, setCurrency] = useState('ETH');
  const [incidentDate, setIncidentDate] = useState('2026-08-26');
  const [description, setDescription] = useState('Victim was promised 200% weekly staking yield on a fraudulent Telegram portal. Funds were swept immediately after transfer.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'my_reports') {
      loadMyReports();
    }
  }, [activeTab]);

  const loadMyReports = async () => {
    setLoadingReports(true);
    try {
      const data = await api.getFraudReports('0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3');
      setMyReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.submitFraudReport({
        reporter_wallet: '0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3',
        target_wallet_or_tx: targetAddress.trim(),
        fraud_type: fraudType,
        amount_lost: parseFloat(amountLost) || 0.0,
        currency: currency,
        incident_date: incidentDate,
        description: description
      });
      setSubmittedReport(res);
      // Reload reports
      loadMyReports();
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Tabs (Report Fraud vs My Reports) */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'file' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileWarning className="w-3.5 h-3.5 inline mr-1.5" /> File New Fraud Incident
        </button>
        <button
          onClick={() => setActiveTab('my_reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'my_reports' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" /> My Submitted Reports ({myReports.length})
        </button>
      </div>

      {activeTab === 'file' ? (
        /* Report Form Card */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Report Fraud Incident</h2>
              <p className="text-xs text-slate-500">
                Help us build a safer crypto ecosystem. Submitting automatically initiates multi-layer intelligence checks and creates an active investigator lead.
              </p>
            </div>
          </div>

          {submittedReport ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Incident Report #{submittedReport.report_id} Submitted!</h3>
              <p className="text-xs text-emerald-700">{submittedReport.message}</p>
              <div className="bg-white border border-emerald-200 p-3 rounded-xl text-xs text-slate-700 text-left">
                <span className="font-bold block mb-1">Instant Auto-Analysis Triggered:</span>
                <span>Assessed Risk Score: <strong className="text-red-600">{submittedReport.risk_check?.risk_score}/100 ({submittedReport.risk_check?.risk_level})</strong></span>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setSubmittedReport(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-xl text-xs transition"
                >
                  File Another Report
                </button>
                <button
                  onClick={() => setActiveTab('my_reports')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-5 rounded-xl text-xs transition"
                >
                  View in My Reports
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wallet Address / Transaction Hash</label>
                <input
                  type="text"
                  required
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x... or Tx Hash"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fraud Type</label>
                  <select
                    value={fraudType}
                    onChange={(e) => setFraudType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Investment Scam / Ponzi">Investment Scam</option>
                    <option value="Phishing & Fake Website">Phishing</option>
                    <option value="Wallet Drainer Sweeper">Wallet Drainer</option>
                    <option value="Address Poisoning">Address Poisoning</option>
                    <option value="Romance / Pig-Butchering">Romance Scam</option>
                    <option value="Impersonation Fraud">Impersonation Fraud</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Lost (Optional)</label>
                  <div className="flex">
                    <input
                      type="number"
                      step="0.01"
                      value={amountLost}
                      onChange={(e) => setAmountLost(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-l-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2.5 rounded-r-xl text-slate-600 font-bold font-mono">
                      ETH
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incident Description</label>
                <textarea
                  required
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, relevant handles, spoofed URLs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
                Submit Report & Trigger Intelligence Check
              </button>
            </form>
          )}
        </div>
      ) : (
        /* My Reports List */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">My Submitted Fraud Reports</h3>
            <button
              onClick={() => setActiveTab('file')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> File Another Report
            </button>
          </div>

          {loadingReports ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading reports...</div>
          ) : myReports.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl">
              <FileWarning className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">No Reports Submitted</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">You have not submitted any fraud reports yet.</p>
              <button
                onClick={() => setActiveTab('file')}
                className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-xs"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((rep) => (
                <div key={rep.id} className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {rep.report_id}
                      </span>
                      <span className="font-bold text-slate-800">{rep.fraud_type}</span>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {rep.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target Address / Hash</span>
                      <span className="font-mono text-slate-800">{rep.target_wallet_or_tx}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Reported Loss</span>
                      <span className="font-bold text-slate-900 font-mono">{rep.amount_lost} {rep.currency}</span>
                    </div>
                  </div>

                  <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl text-[11px] mt-2">
                    {rep.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
