import React, { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, ArrowRight, Shield, RefreshCw } from 'lucide-react';

export const NetworkGraph = ({ data, onSelectWallet, selectedAddress }) => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('CRITICAL'); // 'CRITICAL' (High/Med/Reported) or 'ALL'

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return;

    const width = 640;
    const height = 380;
    const centerX = width / 2;
    const centerY = height / 2;

    // Filter nodes: Only show High Risk, Medium Risk, Reported, and Centralized Exchanges
    const filteredNodes = data.nodes.filter(n => {
      if (filterMode === 'CRITICAL') {
        return ['HIGH RISK', 'MEDIUM RISK', 'REPORTED', 'EXCHANGE'].includes(n.category);
      }
      return true;
    });

    const positionedNodes = filteredNodes.map((node, index) => {
      // Topographic ring layout
      const angle = (index / filteredNodes.length) * 2 * Math.PI;
      let radius = 120;
      if (node.category === 'HIGH RISK') radius = 65;
      else if (node.category === 'REPORTED') radius = 110;
      else if (node.category === 'EXCHANGE') radius = 150;
      else radius = 135;

      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius: node.category === 'HIGH RISK' ? 17 : (node.category === 'EXCHANGE' ? 16 : 14)
      };
    });

    setNodes(positionedNodes);

    const visibleIds = new Set(positionedNodes.map(n => n.id));
    const validLinks = (data.links || []).filter(l => visibleIds.has(l.source) && visibleIds.has(l.target));
    setLinks(validLinks);

    const defaultNode = positionedNodes.find(n => n.category === 'HIGH RISK') || positionedNodes[0];
    setSelectedNode(defaultNode);
  }, [data, filterMode]);

  // Handle external selection
  useEffect(() => {
    if (selectedAddress && nodes.length > 0) {
      const match = nodes.find(n => n.address.toLowerCase() === selectedAddress.toLowerCase());
      if (match) setSelectedNode(match);
    }
  }, [selectedAddress, nodes]);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Links with Blue flow vs White exchange lines
    links.forEach(link => {
      const srcNode = nodes.find(n => n.id === link.source);
      const tgtNode = nodes.find(n => n.id === link.target);
      if (!srcNode || !tgtNode) return;

      const isExchangeLink = link.line_type === 'exchange' || tgtNode.category === 'EXCHANGE';

      ctx.beginPath();
      ctx.moveTo(srcNode.x, srcNode.y);
      ctx.lineTo(tgtNode.x, tgtNode.y);

      if (isExchangeLink) {
        // WHITE / Bright glowing line for Exchange / Cashout
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 3]);
      } else {
        // BLUE / Cyan line for normal flow
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = link.risk >= 71 ? 2.5 : 1.5;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Flow direction particle
      const midX = (srcNode.x + tgtNode.x) / 2;
      const midY = (srcNode.y + tgtNode.y) / 2;
      ctx.beginPath();
      ctx.arc(midX, midY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = isExchangeLink ? '#ffffff' : '#38bdf8';
      ctx.fill();
    });

    // 2. Draw Nodes (High Risk Red, Med Orange, Reported Purple, Exchange Blue)
    nodes.forEach(node => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isSearchMatch = searchQuery && (node.address.toLowerCase().includes(searchQuery.toLowerCase()) || node.label.toLowerCase().includes(searchQuery.toLowerCase()));

      // Outer Glow
      if (node.category === 'HIGH RISK' || isSelected || isSearchMatch) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 7, 0, 2 * Math.PI);
        ctx.fillStyle = (node.color || '#ef4444') + '44';
        ctx.fill();
      }

      // Base Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#0a0e17';
      ctx.fill();
      ctx.lineWidth = isSelected || isSearchMatch ? 3 : 2;
      ctx.strokeStyle = isSelected || isSearchMatch ? '#ffffff' : (node.color || '#3b82f6');
      ctx.stroke();

      // Inner Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius - 5, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#3b82f6';
      ctx.fill();

      // Label below
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(node.label || node.address.slice(0, 8), node.x, node.y + node.radius + 14);

      // Category Pill text
      ctx.font = '8px Inter, sans-serif';
      ctx.fillStyle = node.color;
      ctx.fillText(node.category, node.x, node.y + node.radius + 24);
    });
  }, [nodes, links, selectedNode, searchQuery]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const clicked = nodes.find(node => {
      const dist = Math.hypot(node.x - clickX, node.y - clickY);
      return dist <= node.radius + 10;
    });

    if (clicked) {
      setSelectedNode(clicked);
      if (onSelectWallet) onSelectWallet(clicked.address);
    }
  };

  return (
    <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4 flex flex-col h-full">
      {/* Header, Search & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#1e2638] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Topographic Network Graph</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono">
            {nodes.length} Threat Nodes Active
          </span>
        </div>

        {/* Search inside Graph */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address / hop..."
            className="w-full bg-[#161c2b] border border-[#232e44] rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High Risk
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Risk
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Reported
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-4 h-0.5 bg-[#38bdf8] inline-block"></span> Blue Flow
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-4 h-0.5 bg-white inline-block border-t border-dashed"></span> White Exchange
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 bg-[#090d16] rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          onClick={handleCanvasClick}
          className="cursor-pointer w-full h-full object-contain"
        />

        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#111622]/90 border border-[#1e2638] p-1 rounded-lg text-xs text-slate-400">
          <button
            onClick={() => setFilterMode('CRITICAL')}
            className={`px-2 py-0.5 rounded text-[11px] ${filterMode === 'CRITICAL' ? 'bg-indigo-600 text-white font-semibold' : 'hover:text-white'}`}
          >
            Threats Only
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] ${filterMode === 'ALL' ? 'bg-indigo-600 text-white font-semibold' : 'hover:text-white'}`}
          >
            All Nodes
          </button>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedNode && (
        <div className="mt-3 bg-[#0d121d] border border-[#1e2638] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }}></span>
              <span className="text-white font-mono font-semibold text-xs">{selectedNode.address}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                style={{ backgroundColor: selectedNode.color + '22', color: selectedNode.color }}
              >
                {selectedNode.category}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400">Risk: </span>
              <span className={`text-sm font-bold font-mono ${selectedNode.risk_score >= 71 ? 'text-red-500' : 'text-amber-500'}`}>
                {selectedNode.risk_score} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs border-t border-[#1e2638] pt-2 mb-3 text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-500">Total Transactions</span>
              <span className="text-slate-200 font-semibold">{selectedNode.total_tx || 284}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Total Received</span>
              <span className="text-slate-200 font-semibold">{selectedNode.total_received || '125.45'} ETH</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Total Sent</span>
              <span className="text-slate-200 font-semibold">{selectedNode.total_sent || '112.32'} ETH</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Last Activity</span>
              <span className="text-slate-200 font-semibold">26 Aug 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectWallet && onSelectWallet(selectedNode.address)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition"
            >
              Analyze Wallet
            </button>
            <button
              onClick={() => onSelectWallet && onSelectWallet(selectedNode.address)}
              className="bg-[#1e2638] hover:bg-[#28334b] text-slate-300 py-1.5 px-3 rounded text-xs transition"
            >
              View Associated Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
