import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, HelpCircle, XCircle, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

export const AlertsFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (alertId, feedbackType) => {
    try {
      await api.submitAlertFeedback({
        alert_id: alertId,
        feedback_type: feedbackType,
        investigator_notes: `Investigator classified alert #${alertId} as ${feedbackType}`
      });
      setFeedbackSuccess(`Feedback '${feedbackType}' submitted to model tuning pipeline`);
      setTimeout(() => setFeedbackSuccess(''), 4000);
      loadAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Live Alert Stream & Investigator Feedback Loop</h2>
          <p className="text-xs text-slate-400">
            Real-time fraud alerts prioritized by severity with human-in-the-loop validation for model retraining
          </p>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.map((al) => (
          <div
            key={al.id}
            className="bg-[#111622] border border-[#1e2638] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                al.severity === 'HIGH' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
              }`}></div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{al.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    al.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {al.severity} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{al.subtitle}</p>
                {al.wallet_address && (
                  <span className="text-[11px] font-mono text-indigo-400 mt-1 block">
                    Target Address: {al.wallet_address}
                  </span>
                )}
              </div>
            </div>

            {/* Investigator Feedback Loop Actions */}
            <div className="flex items-center gap-2 border-t md:border-t-0 border-[#1e2638] pt-3 md:pt-0">
              <span className="text-[11px] text-slate-500 mr-2">Investigator Label:</span>
              <button
                onClick={() => handleFeedback(al.id, 'Confirmed Suspicious')}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Confirmed Suspicious
              </button>
              <button
                onClick={() => handleFeedback(al.id, 'False Positive')}
                className="bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ThumbsDown className="w-3.5 h-3.5" /> False Positive
              </button>
              <button
                onClick={() => handleFeedback(al.id, 'Needs Review')}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Needs Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
