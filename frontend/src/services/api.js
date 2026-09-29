const API_BASE = '/api/v1';

export const api = {
  // Auth
  investigatorLogin: async (data) => {
    const res = await fetch(`${API_BASE}/auth/investigator-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Investigator login failed');
    }
    return res.json();
  },

  walletLogin: async (data) => {
    const res = await fetch(`${API_BASE}/auth/wallet-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Wallet connection failed');
    }
    return res.json();
  },

  // Wallets
  getWallets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/wallets?${query}`);
    return res.json();
  },

  getWalletStats: async () => {
    const res = await fetch(`${API_BASE}/wallets/stats`);
    return res.json();
  },

  getWalletProfile: async (address) => {
    const res = await fetch(`${API_BASE}/wallets/${address}`);
    if (!res.ok) throw new Error('Wallet not found');
    return res.json();
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`);
    return res.json();
  },

  preCheckTransaction: async (data) => {
    const res = await fetch(`${API_BASE}/transactions/pre-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  executePayment: async (data) => {
    const res = await fetch(`${API_BASE}/transactions/execute-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Payment failed');
    }
    return res.json();
  },

  sendToInvestigation: async (data) => {
    const res = await fetch(`${API_BASE}/transactions/send-to-investigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to escalate to investigation');
    }
    return res.json();
  },

  // Graph & Follow Money
  getGraphOverview: async () => {
    const res = await fetch(`${API_BASE}/graph/overview`);
    return res.json();
  },

  followTheMoney: async (data) => {
    const res = await fetch(`${API_BASE}/graph/follow-money`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Cases & Evidence
  getCases: async () => {
    const res = await fetch(`${API_BASE}/cases`);
    return res.json();
  },

  createCase: async (data) => {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCaseReport: async (caseId) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/report`);
    return res.json();
  },

  getEvidence: async (caseId = null) => {
    const url = caseId ? `${API_BASE}/evidence?case_id=${caseId}` : `${API_BASE}/evidence`;
    const res = await fetch(url);
    return res.json();
  },

  addEvidence: async (data) => {
    const res = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  verifyEvidenceOnChain: async (evidenceId) => {
    const res = await fetch(`${API_BASE}/evidence/verify/${evidenceId}`);
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/cases/audit/logs`);
    return res.json();
  },

  // Alerts & Feedback
  getAlerts: async () => {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  submitAlertFeedback: async (data) => {
    const res = await fetch(`${API_BASE}/alerts/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Reports
  submitFraudReport: async (data) => {
    const res = await fetch(`${API_BASE}/reports/user-fraud-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit fraud report');
    }
    return res.json();
  },

  getFraudReports: async (reporterWallet = null) => {
    const url = reporterWallet ? `${API_BASE}/reports?reporter_wallet=${encodeURIComponent(reporterWallet)}` : `${API_BASE}/reports`;
    const res = await fetch(url);
    return res.json();
  },

  // ML Metrics & Custom Training Pipeline
  getMLMetrics: async () => {
    const res = await fetch(`${API_BASE}/ml/metrics`);
    return res.json();
  },

  getModelInfo: async () => {
    const res = await fetch(`${API_BASE}/ml/model-info`);
    return res.json();
  },

  trainFromFile: async (formData) => {
    const res = await fetch(`${API_BASE}/ml/train-from-file`, {
      method: 'POST',
      body: formData // multipart/form-data
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Model training failed');
    }
    return res.json();
  },

  predictLiveML: async (features) => {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    return res.json();
  },

  retrainML: async () => {
    const res = await fetch(`${API_BASE}/ml/retrain`, { method: 'POST' });
    return res.json();
  },

  // Resilience Health & Simulator
  getResilienceHealth: async () => {
    const res = await fetch(`${API_BASE}/simulation/resilience-health`);
    return res.json();
  },

  triggerSimulation: async (scenario = null) => {
    const url = scenario ? `${API_BASE}/simulation/trigger?scenario=${scenario}` : `${API_BASE}/simulation/trigger`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  }
};
