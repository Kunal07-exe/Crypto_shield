import React from 'react';
import {
  LayoutDashboard,
  FolderLock,
  Wallet,
  ArrowLeftRight,
  Blocks,
  Network,
  FileWarning,
  ShieldCheck,
  Bell,
  Cpu,
  History,
  Settings,
  LogOut,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  SearchCode,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ currentView, onViewChange }) => {
  const { portalMode, logout } = useAuth();
  const isInvestigator = portalMode === 'investigator';

  const investigatorNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'investigation_hub', label: 'Investigation Hub', icon: SearchCode },
    { id: 'ml_trainer', label: 'Model Trainer', icon: BrainCircuit, badge: 'AI' },
    { id: 'cases', label: 'Cases', icon: FolderLock },
    { id: 'wallet_intel', label: 'Wallet Intelligence', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'network_graph', label: 'Network Graph', icon: Network },
    { id: 'fraud_reports', label: 'Fraud Reports', icon: FileWarning },
    { id: 'evidence', label: 'Evidence Vault', icon: ShieldCheck },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'ml_metrics', label: 'ML & Drift Metrics', icon: Cpu },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const userNav = [
    { id: 'user_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user_transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'user_risk_alerts', label: 'Risk Alerts', icon: Bell, badge: '2' },
    { id: 'user_wallets', label: 'Connected Wallets', icon: Wallet },
    { id: 'user_report_fraud', label: 'Report Fraud', icon: FileWarning },
    { id: 'user_my_reports', label: 'My Reports', icon: FileCheck },
    { id: 'user_security_tips', label: 'Security Tips', icon: ShieldCheck },
    { id: 'user_settings', label: 'Settings', icon: Settings }
  ];

  const navItems = isInvestigator ? investigatorNav : userNav;

  return (
    <aside className={`w-60 flex-shrink-0 flex flex-col justify-between p-4 border-r transition-colors ${
      isInvestigator 
        ? 'bg-[#0c1017] border-[#1a2335] text-slate-300' 
        : 'bg-white border-slate-200 text-slate-600'
    }`}>
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 10.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div>
            <h1 className={`font-bold text-sm leading-none ${isInvestigator ? 'text-white' : 'text-slate-900'}`}>
              CryptoShield
            </h1>
            <span className={`text-[10px] font-medium leading-none ${isInvestigator ? 'text-indigo-400' : 'text-emerald-600'}`}>
              {isInvestigator ? 'Investigation Platform' : 'Protect Your Crypto'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? isInvestigator
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold'
                      : 'bg-emerald-600 text-white font-semibold'
                    : isInvestigator
                      ? 'text-slate-400 hover:bg-[#151c2c] hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isInvestigator ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout / Switch Footer */}
      <div className="pt-4 border-t border-dashed border-slate-700/50">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
            isInvestigator ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
