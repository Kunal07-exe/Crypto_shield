import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveCounters, setLiveCounters] = useState({
    highRiskWallets: 128,
    suspiciousTx: 342,
    monitoredWallets: 1284,
    activeCases: 67,
    liveTxRate: 14.8
  });
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  // Load real stats from backend on mount
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        const res = await fetch('/api/v1/wallets/stats');
        if (res.ok) {
          const data = await res.json();
          setLiveCounters(prev => ({
            ...prev,
            highRiskWallets: data.high_risk_wallets || prev.highRiskWallets,
            suspiciousTx: data.suspicious_transactions || prev.suspiciousTx,
            monitoredWallets: data.monitored_wallets || prev.monitoredWallets,
            activeCases: data.active_cases || prev.activeCases,
          }));
        }
      } catch (e) {
        console.warn('[CryptoShield] Could not load initial stats from backend', e);
      }
    };
    loadInitialStats();
  }, []);

  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      try {
        // Use relative path so Vite proxy handles ws:// forwarding
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/live-stream`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!destroyed) {
            setIsConnected(true);
            console.log('[CryptoShield] WebSocket stream connected');
          }
        };

        ws.onmessage = (event) => {
          if (destroyed) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.event === 'NEW_TRANSACTION' && msg.data) {
              const tx = msg.data;

              setLiveTransactions((prev) => {
                // Prevent duplicate tx_hash
                if (prev.some(t => t.tx_hash === tx.tx_hash)) return prev;
                return [tx, ...prev.slice(0, 49)];
              });

              if (tx.has_alert || tx.risk_score >= 71) {
                setLiveAlerts((prev) => [
                  {
                    id: Date.now() + Math.random(),
                    title: tx.fraud_type || 'High Risk Transaction',
                    subtitle: `${tx.amount} ETH · ${tx.sender.slice(0, 8)}... → ${tx.receiver.slice(0, 8)}...`,
                    severity: tx.risk_score >= 85 ? 'CRITICAL' : 'HIGH',
                    wallet_address: tx.sender,
                    tx_hash: tx.tx_hash,
                    timestamp: tx.timestamp || new Date().toISOString(),
                    alert_type: tx.fraud_type,
                    details: tx
                  },
                  ...prev.slice(0, 19)
                ]);

                setLiveCounters((prev) => ({
                  ...prev,
                  suspiciousTx: prev.suspiciousTx + 1,
                  highRiskWallets: tx.risk_score >= 85 ? prev.highRiskWallets + 1 : prev.highRiskWallets,
                  activeCases: tx.risk_score >= 90 ? prev.activeCases + 1 : prev.activeCases,
                }));
              }
            }
          } catch (e) {
            console.warn('[CryptoShield] Failed to parse WS message', e);
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          if (!destroyed) {
            reconnectRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.warn('[CryptoShield] WebSocket error:', err);
        if (!destroyed) {
          reconnectRef.current = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      destroyed = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, []);

  // Expose counter refresh function
  const refreshCounters = async () => {
    try {
      const res = await fetch('/api/v1/wallets/stats');
      if (res.ok) {
        const data = await res.json();
        setLiveCounters(prev => ({
          ...prev,
          highRiskWallets: data.high_risk_wallets || prev.highRiskWallets,
          suspiciousTx: data.suspicious_transactions || prev.suspiciousTx,
          monitoredWallets: data.monitored_wallets || prev.monitoredWallets,
          activeCases: data.active_cases || prev.activeCases,
        }));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      liveTransactions,
      liveAlerts,
      liveCounters,
      refreshCounters
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
