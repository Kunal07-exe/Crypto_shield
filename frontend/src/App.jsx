import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Investigator Views
import { InvestigatorLogin } from './views/investigator/InvestigatorLogin';
import { InvestigatorDashboard } from './views/investigator/InvestigatorDashboard';
import { InvestigationHub } from './views/investigator/InvestigationHub';
import { MLTrainer } from './views/investigator/MLTrainer';
import { CaseManagement } from './views/investigator/CaseManagement';
import { WalletIntelligence } from './views/investigator/WalletIntelligence';
import { TransactionAnalysis } from './views/investigator/TransactionAnalysis';
import { EvidenceManager } from './views/investigator/EvidenceManager';
import { MLModelMetrics } from './views/investigator/MLModelMetrics';
import { AlertsFeed } from './views/investigator/AlertsFeed';
import { AuditLogs } from './views/investigator/AuditLogs';

// User Views
import { UserConnectWallet } from './views/user/UserConnectWallet';
import { UserDashboard } from './views/user/UserDashboard';
import { UserTransactions } from './views/user/UserTransactions';
import { UserReportFraud } from './views/user/UserReportFraud';
import { UserSecurityTips } from './views/user/UserSecurityTips';

export function App() {
  const { user, portalMode, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedWalletAddress, setSelectedWalletAddress] = useState(null);

  // If not authenticated in current portal mode, show corresponding login/connector
  if (!isAuthenticated) {
    if (portalMode === 'investigator') {
      return <InvestigatorLogin />;
    } else {
      return <UserConnectWallet />;
    }
  }

  const handleGlobalSearch = (query) => {
    if (query.startsWith('0x')) {
      setSelectedWalletAddress(query);
      setCurrentView('wallet_intel');
    } else if (query.startsWith('CR-')) {
      setCurrentView('cases');
    } else {
      setSelectedWalletAddress(query);
      setCurrentView('wallet_intel');
    }
  };

  const isInvestigator = portalMode === 'investigator';

  const renderInvestigatorContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <InvestigatorDashboard
            onNavigateToWallet={(addr) => {
              setSelectedWalletAddress(addr);
              setCurrentView('wallet_intel');
            }}
            onNavigateToCases={() => setCurrentView('cases')}
          />
        );
      case 'investigation_hub':
        return <InvestigationHub />;
      case 'ml_trainer':
        return <MLTrainer />;
      case 'cases':
        return <CaseManagement />;
      case 'wallet_intel':
        return <WalletIntelligence initialAddress={selectedWalletAddress} />;
      case 'transactions':
        return <TransactionAnalysis />;
      case 'network_graph':
        return (
          <div className="h-[calc(100vh-140px)]">
            <InvestigatorDashboard
              onNavigateToWallet={(addr) => {
                setSelectedWalletAddress(addr);
                setCurrentView('wallet_intel');
              }}
              onNavigateToCases={() => setCurrentView('cases')}
            />
          </div>
        );
      case 'evidence':
        return <EvidenceManager />;
      case 'alerts':
        return <AlertsFeed />;
      case 'ml_metrics':
        return <MLModelMetrics />;
      case 'audit_logs':
        return <AuditLogs />;
      case 'fraud_reports':
        return <CaseManagement />;
      case 'settings':
        return (
          <div className="bg-[#111622] border border-[#1e2638] p-6 rounded-xl text-xs space-y-4">
            <h3 className="text-base font-bold text-white">Investigator Platform Configuration</h3>
            <p className="text-slate-400">Multi-Chain Gateway: Ethereum, Bitcoin, Solana, BNB Chain, Polygon active.</p>
            <p className="text-slate-400">Real-Time Streaming Engine: 5 Workers Active (Behavioral, Graph, ML, Smart Contract, Threat Intel).</p>
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-indigo-300">
              Role: Senior Cybercrime Investigator (Agency Clearance Level 4)
            </div>
          </div>
        );
      default:
        return (
          <InvestigatorDashboard
            onNavigateToWallet={(addr) => {
              setSelectedWalletAddress(addr);
              setCurrentView('wallet_intel');
            }}
            onNavigateToCases={() => setCurrentView('cases')}
          />
        );
    }
  };

  const renderUserContent = () => {
    switch (currentView) {
      case 'user_dashboard':
      case 'dashboard':
        return <UserDashboard onNavigateToReport={() => setCurrentView('user_report_fraud')} />;
      case 'user_transactions':
        return <UserTransactions />;
      case 'user_risk_alerts':
        return <UserDashboard onNavigateToReport={() => setCurrentView('user_report_fraud')} />;
      case 'user_wallets':
        return <UserConnectWallet />;
      case 'user_report_fraud':
        return <UserReportFraud defaultTab="file" />;
      case 'user_my_reports':
        return <UserReportFraud defaultTab="my_reports" />;
      case 'user_security_tips':
        return <UserSecurityTips />;
      case 'user_settings':
        return <UserSecurityTips />;
      default:
        return <UserDashboard onNavigateToReport={() => setCurrentView('user_report_fraud')} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isInvestigator ? 'bg-[#0a0d14]' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onSearch={handleGlobalSearch} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {isInvestigator ? renderInvestigatorContent() : renderUserContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
