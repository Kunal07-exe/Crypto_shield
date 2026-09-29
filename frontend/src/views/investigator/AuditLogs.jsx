import React, { useState, useEffect } from 'react';
import { History, Shield, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Cryptographic System Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable tamper-evident ledger of investigator logins, telemetry queries, case updates, and on-chain anchor events
          </p>
        </div>
        <button
          onClick={loadAuditLogs}
          className="bg-[#161c2b] border border-[#1e2638] text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      <div className="bg-[#111622] border border-[#1e2638] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading audit trail records...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No audit records logged yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1e2638]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor / Origin</th>
                <th className="p-3.5">Action Performed</th>
                <th className="p-3.5">Target Resource</th>
                <th className="p-3.5">Security Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638] text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#151c2c] transition">
                  <td className="p-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.time}</td>
                  <td className="p-3.5 font-semibold text-white">{log.actor}</td>
                  <td className="p-3.5">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">{log.target}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
