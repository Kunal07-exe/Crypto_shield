import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/StatCard';
import { RiskDonutChart } from '../../components/RiskDonutChart';
import { NetworkGraph } from '../../components/NetworkGraph';
import { FollowMoneyModal } from '../../components/FollowMoneyModal';
import { CaseReportModal } from '../../components/CaseReportModal';
import { BlockchainProofModal } from '../../components/BlockchainProofModal';
import { useWebSocket } from '../../context/WebSocketContext';
import { api } from '../../services/api';
import { ArrowRight, AlertTriangle, ShieldCheck, GitFork, FileText, Zap, RefreshCw, CheckCircle } from 'lucide-react';

export const InvestigatorDashboard = ({ onNavigateToWallet, onNavigateToCases }) => {
  const { liveCounters, liveAlerts, refreshCounters } = useWebSocket();
  const [graphData, setGraphData] = useState(null);
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(null); // which scenario is loading
  const [simMsg, setSimMsg] = useState('');

  const [followMoneyTarget, setFollowMoneyTarget] = useState('0x71C8F794B2a6886e088a29A7228800Fc92779A42');
  const [isFollowMoneyOpen, setIsFollowMoneyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [gData, cData, aData, sData] = await Promise.all([
        api.getGraphOverview(),
        api.getCases(),
        api.getAlerts(),
        api.getWalletStats()
      ]);
      setGraphData(gData);
      setCases(cData);
      setAlerts(aData);
      setStats(sData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenReport = async (caseId) => {
    try {
      const rep = await api.getCaseReport(caseId);
      setReportData(rep);
      setIsReportOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSimulation = async (scenario) => {
    setSimulating(scenario);
    setSimMsg('');
    try {
      const result = await api.triggerSimulation(scenario);
      setSimMsg(`Injected: ${result.transaction?.fraud_type || scenario} — Risk ${result.transaction?.risk_score || '?'}/100`);
      await refreshCounters();
      await fetchDashboardData();
    } catch (err) {
      setSimMsg('Simulation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSimulating(null);
      setTimeout(() => setSimMsg(''), 5000);
    }
  };

  const combinedAlerts = [...liveAlerts.slice(0, 3), ...alerts.filter(a => !liveAlerts.some(la => la.tx_hash === a.tx_hash))].slice(0, 5);

  const riskHigh = stats?.risk_distribution?.high || liveCounters.highRiskWallets;
  const riskMed = stats?.risk_distribution?.medium || 342;
  const riskLow = stats?.risk_distribution?.low || 582;

  return (
    <div className="space-y-6">
      {/* Top 4 Stat Cards (Backend-Driven) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="High Risk Wallets"
          value={stats ? stats.high_risk_wallets : liveCounters.highRiskWallets}
          change="+12 today"
          color="red"
          sparkline={[110, 115, 118, 122, 120, 125, 128]}
        />
        <StatCard
          title="Suspicious Transactions"
          value={stats ? stats.suspicious_transactions : liveCounters.suspiciousTx}
          change="+28 today"
          color="yellow"
          sparkline={[280, 295, 310, 318, 330, 335, 342]}
        />
        <StatCard
          title="Monitored Wallets"
          value={(stats ? stats.monitored_wallets : liveCounters.monitoredWallets).toLocaleString()}
          change="+96 today"
          color="green"
          sparkline={[1150, 1180, 1210, 1240, 1260, 1275, 1284]}
        />
        <StatCard
          title="Active Cases"
          value={stats ? stats.active_cases : liveCounters.activeCases}
          change="+5 today"
          color="blue"
          sparkline={[55, 58, 60, 62, 64, 66, 67]}
        />
      </div>

      {/* Attack Simulator Control Bar */}
      <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Live Cyber-Attack Injection Simulator:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ADDRESS_POISONING', label: 'Address Poisoning', color: 'red' },
            { key: 'WALLET_DRAINER_SWEEP', label: 'Wallet Drainer', color: 'purple' },
            { key: 'MULE_LAYERING', label: 'Mule Layering', color: 'amber' },
            { key: 'EXCHANGE_DEPOSIT', label: 'Exchange Cashout', color: 'blue' }
          ].map(sim => (
            <button
              key={sim.key}
              onClick={() => handleTriggerSimulation(sim.key)}
              disabled={simulating !== null}
              className={`bg-${sim.color}-500/10 hover:bg-${sim.color}-500/20 text-${sim.color}-400 border border-${sim.color}-500/30 px-2.5 py-1 rounded-md transition flex items-center gap-1.5 disabled:opacity-50`}
            >
              {simulating === sim.key ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
              {sim.label}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2.5 py-1 rounded-md transition flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        {simMsg && (
          <div className="w-full flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg font-mono text-[11px]">
            <CheckCircle className="w-3.5 h-3.5" /> {simMsg}
          </div>
        )}
      </div>

      {/* Main 12-col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Investigations Table */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Recent Investigations</h3>
              <button
                onClick={onNavigateToCases}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View All Cases <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading investigations...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-[#1e2638]">
                    <th className="pb-2 font-medium">Case ID</th>
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Risk Score</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Updated</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638] text-slate-300">
                  {cases.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-[#151c2c] transition">
                      <td className="py-2.5 font-mono text-indigo-400 font-semibold">{c.case_id}</td>
                      <td className="py-2.5 font-mono text-slate-200">{c.subject}</td>
                      <td className="py-2.5">
                        <span className={`font-mono font-bold ${
                          c.risk_score >= 71 ? 'text-red-500' : c.risk_score >= 31 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {c.risk_score} <span className="text-[10px] text-slate-500">/100</span>
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'Under Investigation' ? 'bg-indigo-500/10 text-indigo-400' :
                          c.status === 'High Risk' ? 'bg-red-500/10 text-red-400' :
                          c.status === 'Pending Review' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Aug 2026'}
                      </td>
                      <td className="py-2.5 text-right flex gap-1 justify-end">
                        <button
                          onClick={() => handleOpenReport(c.case_id)}
                          className="bg-[#1e2638] hover:bg-indigo-600 hover:text-white text-slate-300 px-2 py-1 rounded text-[11px] transition"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => onNavigateToWallet && onNavigateToWallet(c.primary_wallet)}
                          className="bg-[#1e2638] hover:bg-[#28334b] text-slate-300 px-2 py-1 rounded text-[11px] transition"
                        >
                          Wallet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Risk Distribution & Follow Money */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskDonutChart high={riskHigh} medium={riskMed} low={riskLow} />

            <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <GitFork className="w-5 h-5" />
                  <h3 className="text-white font-semibold text-sm">Follow the Money</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Recursive multi-hop fund tracing to identify exit exchanges, mixers, and money laundering layers.
                </p>
                <div className="bg-[#0c1017] p-2.5 rounded-lg border border-[#1e2638] text-xs font-mono text-slate-300 mb-3 break-all">
                  {followMoneyTarget.slice(0, 14)}...{followMoneyTarget.slice(-6)}
                </div>
              </div>
              <button
                onClick={() => setIsFollowMoneyOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <GitFork className="w-4 h-4" /> Launch Follow Money Tracer
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Topographic Network Graph */}
          <div className="h-[460px]">
            <NetworkGraph
              data={graphData}
              selectedAddress={followMoneyTarget}
              onSelectWallet={(addr) => {
                setFollowMoneyTarget(addr);
                if (onNavigateToWallet) onNavigateToWallet(addr);
              }}
            />
          </div>

          {/* Live Alerts Feed */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Recent Alerts</h3>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                LIVE INTEL
              </span>
            </div>
            <div className="space-y-2.5">
              {combinedAlerts.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No alerts. System monitoring is active.</p>
              ) : (
                combinedAlerts.map((al, idx) => (
                  <div key={al.id || idx} className="bg-[#0c1017] border border-[#1e2638] p-3 rounded-lg flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      al.severity === 'CRITICAL' ? 'bg-red-600 animate-pulse' :
                      al.severity === 'HIGH' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-white truncate">{al.title || al.alert_type}</h4>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {al.timestamp ? new Date(al.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : `${idx * 7 + 2}m ago`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {al.subtitle || al.wallet_address || al.details?.fraud_type}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FollowMoneyModal
        isOpen={isFollowMoneyOpen}
        onClose={() => setIsFollowMoneyOpen(false)}
        initialAddress={followMoneyTarget}
      />
      <CaseReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={reportData}
      />
    </div>
  );
};
