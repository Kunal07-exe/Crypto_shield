import React, { useState } from 'react';
import { Search, Bell, Shield, User, ArrowRightLeft, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export const Navbar = ({ onSearch, title = "Dashboard Overview", subtitle = "Real-time investigation insights and analytics" }) => {
  const { user, portalMode, setPortalMode } = useAuth();
  const { isConnected } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const isInvestigator = portalMode === 'investigator';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className={`px-6 py-3.5 border-b flex items-center justify-between transition-colors ${
      isInvestigator 
        ? 'bg-[#0c1017] border-[#1a2335] text-slate-200' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Title / Subtitle */}
      <div>
        <h2 className="text-base font-bold leading-tight text-white">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      {/* Center Search & Actions */}
      <div className="flex items-center gap-4">
        {isInvestigator && (
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wallet / transaction / case ID..."
              className="w-full bg-[#151c2c] border border-[#232e44] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </form>
        )}

        {/* Live Stream Indicator */}
        <div className="flex items-center gap-2 bg-[#151c2c] border border-[#232e44] px-2.5 py-1 rounded-full text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-[11px] text-slate-300 font-medium">
            {isConnected ? 'Kafka Real-Time Stream' : 'Connecting...'}
          </span>
        </div>

        {/* Portal Mode Switcher Button (Convenient for demoing both portals) */}
        <button
          onClick={() => setPortalMode(isInvestigator ? 'user' : 'investigator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            isInvestigator 
              ? 'bg-[#1a2236] border-[#293754] text-indigo-300 hover:bg-[#222d48]'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
          title="Switch between Investigator & Wallet User Portals"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Switch to {isInvestigator ? 'User Portal' : 'Investigator Portal'}</span>
        </button>

        {/* User Identity Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          isInvestigator ? 'bg-[#151c2c] border-[#232e44]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            {isInvestigator ? 'INV' : 'ETH'}
          </div>
          <div className="text-left leading-tight">
            <span className={`text-xs font-semibold block ${isInvestigator ? 'text-white' : 'text-slate-900'}`}>
              {user?.name || (isInvestigator ? 'Inv. Rahul Verma' : 'Retail User')}
            </span>
            <span className="text-[10px] text-slate-400">
              {isInvestigator ? 'Cyber Crime Unit' : (user?.wallet_address ? `${user.wallet_address.slice(0, 6)}...` : '0x82A...71F3')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
