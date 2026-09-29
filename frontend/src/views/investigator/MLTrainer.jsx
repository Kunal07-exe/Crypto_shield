import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Play,
  FileCheck,
  Check,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export const MLTrainer = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetCol, setTargetCol] = useState('');
  const [testSize, setTestSize] = useState(0.30);
  const [useSmote, setUseSmote] = useState(true);
  const [rfEstimators, setRfEstimators] = useState(100);
  const [xgbEstimators, setXgbEstimators] = useState(120);

  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState(0);
  const [trainingResult, setTrainingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeModelInfo, setActiveModelInfo] = useState(null);

  // Live Playground Sandbox state
  const [testFeatures, setTestFeatures] = useState({
    indegree: 18,
    outdegree: 25,
    in_btc: 14.5,
    out_btc: 14.2,
    total_btc: 28.7,
    mean_in_btc: 0.8,
    mean_out_btc: 0.56,
    in_malicious: 1,
    out_malicious: 1,
    out_and_tx_malicious: 0.9,
    all_malicious: 0.9
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadModelInfo();
  }, []);

  const loadModelInfo = async () => {
    try {
      const info = await api.getModelInfo();
      setActiveModelInfo(info);
    } catch (e) {
      console.error('Failed loading model info', e);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setErrorMsg('');
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.parquet', '.pdf', '.txt', '.tsv'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload a CSV, Excel (.xlsx/.xls), JSON, Parquet, PDF, or TXT dataset.`);
      return;
    }
    setFile(selectedFile);
  };

  const handleTrainSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a dataset file to begin training.');
      return;
    }

    setErrorMsg('');
    setIsTraining(true);
    setTrainingStep(1);

    // Progress simulation steps for visual feedback
    const stepTimer1 = setTimeout(() => setTrainingStep(2), 700);
    const stepTimer2 = setTimeout(() => setTrainingStep(3), 1400);
    const stepTimer3 = setTimeout(() => setTrainingStep(4), 2100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (targetCol.trim()) formData.append('target_col', targetCol.trim());
      formData.append('test_size', testSize);
      formData.append('use_smote', useSmote);
      formData.append('rf_n_estimators', rfEstimators);
      formData.append('xgb_n_estimators', xgbEstimators);

      const result = await api.trainFromFile(formData);
      setTrainingStep(5);
      setTrainingResult(result);
      await loadModelInfo();
    } catch (err) {
      setErrorMsg(err.message || 'Model training pipeline encountered an error.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsTraining(false);
    }
  };

  const handleSampleLoad = (type) => {
    let content = '';
    let filename = '';

    if (type === 'bitcoin') {
      filename = 'bitcoin_graph_sample.csv';
      content = `indegree,outdegree,in_btc,out_btc,total_btc,mean_in_btc,mean_out_btc,in_malicious,out_malicious,out_and_tx_malicious,all_malicious,is_fraud
3,2,1.5,1.4,2.9,0.5,0.7,0,0,0.0,0.0,0
2,3,0.8,0.7,1.5,0.4,0.23,0,0,0.0,0.0,0
4,1,3.2,3.1,6.3,0.8,3.1,0,0,0.0,0.0,0
1,25,15.0,15.0,30.0,15.0,0.6,1,1,0.9,0.9,1
2,40,22.0,21.8,43.8,11.0,0.54,1,1,0.85,0.85,1
3,2,2.0,1.9,3.9,0.66,0.95,0,0,0.0,0.0,0
1,30,18.0,17.9,35.9,18.0,0.59,1,1,0.95,0.95,1
2,2,0.5,0.49,0.99,0.25,0.24,0,0,0.0,0.0,0
5,2,4.0,3.9,7.9,0.8,1.95,0,0,0.0,0.0,0
1,35,25.0,24.9,49.9,25.0,0.71,1,1,1.0,1.0,1
3,3,1.2,1.1,2.3,0.4,0.36,0,0,0.0,0.0,0
2,1,0.9,0.85,1.75,0.45,0.85,0,0,0.0,0.0,0
6,4,5.2,5.1,10.3,0.86,1.27,0,0,0.0,0.0,0
1,28,19.5,19.4,38.9,19.5,0.69,1,1,0.92,0.92,1
`;
    } else {
      filename = 'raw_crypto_tx_records.json';
      const sampleJson = [
        { sender: "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", receiver: "0x55c68997a3915124019a97f39442011929997f3", amount: 0.45, is_fraud: 0 },
        { sender: "0x71C8F794B2a6886e088a29A7228800Fc92779A42", receiver: "0x82a91ffffffffffffffffffffffffffffffb71f3", amount: 0.0001, is_fraud: 1 },
        { sender: "0x19b08f8832a82914101e1882361b17a102712804", receiver: "0x91d5757b46bb354438341618a8b13998f82877a1", amount: 8.5, is_fraud: 1 },
        { sender: "0xAA38221890e0c5fb6e680a7114138e68224435FB", receiver: "0x71C8F794B2a6886e088a29A7228800Fc92779A42", amount: 15.2, is_fraud: 1 },
        { sender: "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", receiver: "0x91d5757b46bb354438341618a8b13998f82877a1", amount: 0.8, is_fraud: 0 },
        { sender: "0x55c68997a3915124019a97f39442011929997f3", receiver: "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", amount: 0.35, is_fraud: 0 },
        { sender: "0x19b08f8832a82914101e1882361b17a102712804", receiver: "0xbinancehotwallet000000000000000000000001", amount: 6.2, is_fraud: 1 },
        { sender: "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", receiver: "0xAA38221890e0c5fb6e680a7114138e68224435FB", amount: 1.1, is_fraud: 0 },
        { sender: "0x71C8F794B2a6886e088a29A7228800Fc92779A42", receiver: "0x19b08f8832a82914101e1882361b17a102712804", amount: 14.8, is_fraud: 1 },
        { sender: "0x91d5757b46bb354438341618a8b13998f82877a1", receiver: "0x55c68997a3915124019a97f39442011929997f3", amount: 0.25, is_fraud: 0 }
      ];
      content = JSON.stringify(sampleJson, null, 2);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const sampleFile = new File([blob], filename, { type: 'text/plain' });
    setFile(sampleFile);
  };

  const handleRunTestPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await api.predictLiveML(testFeatures);
      setPredictionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPredicting(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <UploadCloud className="w-10 h-10 text-indigo-400" />;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext === '.pdf') return <FileText className="w-10 h-10 text-red-400" />;
    if (['.xlsx', '.xls', '.csv'].includes(ext)) return <FileSpreadsheet className="w-10 h-10 text-emerald-400" />;
    return <FileText className="w-10 h-10 text-indigo-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                AI / ML Training Engine
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">Custom Dataset Training Pipeline</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Upload any document format (<strong>PDF, CSV, Excel, JSON, Parquet, TXT</strong>). The pipeline automatically extracts graph topological features, handles SMOTE class balancing, and fits optimized <strong>XGBoost + Random Forest</strong> models.
            </p>
          </div>

          {/* Active Model Status Pill */}
          {activeModelInfo && (
            <div className="bg-[#0c1017] border border-[#1e2638] rounded-xl p-3.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">Active Live Classifier</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {activeModelInfo.dataset_info?.source || 'Baseline Ensemble'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Features: {activeModelInfo.features?.length || 11} | Last: {activeModelInfo.trained_at ? new Date(activeModelInfo.trained_at).toLocaleTimeString() : 'Active'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Upload & Controls on Left, Live Status on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Upload Dropzone & Hyperparameter Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* File Upload Dropzone */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Step 1: Upload Dataset (Any File Type)</span>
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                  : file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-[#232e44] bg-[#0c1017] hover:border-indigo-500/50 hover:bg-[#151c2c]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
                className="hidden"
                accept=".csv,.xlsx,.xls,.json,.parquet,.pdf,.txt,.tsv"
              />

              <div className="flex flex-col items-center">
                <div className="mb-3 p-3 rounded-2xl bg-[#161c2b] border border-[#232e44]">
                  {getFileIcon()}
                </div>

                {file ? (
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white block">{file.name}</span>
                    <span className="text-xs text-slate-400 block font-mono">
                      {formatFileSize(file.size)} · Ready for Feature Extraction
                    </span>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ✓ File Attached
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block mb-1">
                      Drag & Drop your dataset file here, or <span className="text-indigo-400 underline">browse</span>
                    </span>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Supports PDF transaction reports, CSV, Excel spreadsheets, JSON arrays, Parquet, and TSV tables.
                    </p>
                  </div>
                )}
              </div>

              {/* Supported Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5 pt-4 border-t border-[#1e2638]">
                {['.PDF', '.CSV', '.XLSX', '.JSON', '.PARQUET', '.TXT'].map((ext) => (
                  <span key={ext} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161c2b] border border-[#232e44] text-slate-400">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Sample Load Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">Need test data?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSampleLoad('bitcoin')}
                  className="bg-[#161c2b] hover:bg-[#1e2638] text-indigo-300 border border-[#232e44] px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Bitcoin Graph CSV Sample
                </button>
                <button
                  type="button"
                  onClick={() => handleSampleLoad('json')}
                  className="bg-[#161c2b] hover:bg-[#1e2638] text-purple-300 border border-[#232e44] px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Raw Multi-Hop JSON Sample
                </button>
              </div>
            </div>
          </div>

          {/* Hyperparameter Controls */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Step 2: Training & Algorithm Hyperparameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Target Column Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Label Column (Optional)
                </label>
                <input
                  type="text"
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  placeholder="Auto-detect (is_fraud / class / label)"
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Leave blank to auto-detect or use unsupervised anomaly labeling.
                </span>
              </div>

              {/* Train/Test Split */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Test Evaluation Split</label>
                  <span className="font-mono text-indigo-400 font-bold">{Math.round(testSize * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>90/10 Split</span>
                  <span>70/30 (Recommended)</span>
                  <span>60/40 Split</span>
                </div>
              </div>

              {/* SMOTE Class Balancing */}
              <div className="md:col-span-2 bg-[#0c1017] border border-[#1e2638] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block text-xs">
                    SMOTE Synthetic Minority Balancing (Algorithm 1)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Oversamples rare 1–2% fraud class via k-nearest synthetic vector interpolation.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSmote}
                    onChange={(e) => setUseSmote(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* RF Trees */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Random Forest Estimators</label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={rfEstimators}
                  onChange={(e) => setRfEstimators(parseInt(e.target.value) || 100)}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* XGBoost Estimators */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">XGBoost Boosted Trees</label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={xgbEstimators}
                  onChange={(e) => setXgbEstimators(parseInt(e.target.value) || 120)}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleTrainSubmit}
              disabled={isTraining || !file}
              className="mt-5 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing Pipeline & Training Models...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Train & Deploy XGBoost + Random Forest Models</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 5 cols: Live Training Status & Pipeline Stepper */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pipeline Stepper Card */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Pipeline Execution Lifecycle</span>
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { step: 1, label: 'Ingest File & Parse Format', desc: 'Validates tabular structure, PDF OCR / delimiters' },
                { step: 2, label: 'Feature Engineering & Graph Metrics', desc: 'Computes in/out degrees, volume ratios & risk signals' },
                { step: 3, label: 'SMOTE Class Balancing', desc: 'Synthesizes minority fraud instances to prevent bias' },
                { step: 4, label: 'Train Random Forest Ensemble', desc: 'Fits parallel decision trees on resampled feature space' },
                { step: 5, label: 'Train Gradient-Boosted XGBoost', desc: 'Optimizes log-loss gradient descent for max ROC-AUC' },
                { step: 6, label: 'Hot-Reload Live Detection Engine', desc: 'Persists .pkl artifacts to backend/app/ml_models/' }
              ].map((s) => {
                const isCompleted = trainingResult || trainingStep > s.step;
                const isCurrent = isTraining && trainingStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                      isCurrent
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-white'
                        : isCompleted
                          ? 'bg-emerald-500/5 text-slate-300'
                          : 'text-slate-500 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-[#1e2638] text-slate-500'
                      }`}
                    >
                      {isCompleted ? '✓' : s.step}
                    </div>
                    <div>
                      <span className={`font-semibold block ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{s.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Training Confirmation Badge */}
          {trainingResult && (
            <div className="bg-gradient-to-br from-emerald-950/40 to-[#111622] border border-emerald-500/30 rounded-2xl p-5 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Models Successfully Trained & Deployed!</span>
              </div>
              <p className="text-slate-300 mb-3">
                Both XGBoost and Random Forest have been serialized to <code className="text-emerald-300 font-mono text-[11px]">app/ml_models/</code> and are actively classifying real-time transactions.
              </p>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-emerald-500/20 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Dataset Source</span>
                  <span className="font-bold text-white font-mono truncate block">{trainingResult.dataset_summary?.filename}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Winning Classifier</span>
                  <span className="font-bold text-indigo-400 font-mono block">{trainingResult.comparison?.winning_model}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section (Appears after training) */}
      {trainingResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top 4 Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-indigo-500/30 rounded-2xl p-5">
              <span className="text-xs text-indigo-400 font-semibold block mb-1">XGBoost ROC-AUC</span>
              <div className="text-2xl font-black font-mono text-white">
                {trainingResult.xgb_metrics?.roc_auc}
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                ★ Top Discriminator Rating
              </span>
            </div>

            <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-5">
              <span className="text-xs text-purple-400 font-semibold block mb-1">Random Forest ROC-AUC</span>
              <div className="text-2xl font-black font-mono text-white">
                {trainingResult.rf_metrics?.roc_auc}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ensemble Tree Baseline
              </span>
            </div>

            <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-5">
              <span className="text-xs text-emerald-400 font-semibold block mb-1">XGBoost F1-Score</span>
              <div className="text-2xl font-black font-mono text-white">
                {trainingResult.xgb_metrics?.f1}%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Precision: {trainingResult.xgb_metrics?.precision}% | Recall: {trainingResult.xgb_metrics?.recall}%
              </span>
            </div>

            <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-5">
              <span className="text-xs text-amber-400 font-semibold block mb-1">Training Observations</span>
              <div className="text-2xl font-black font-mono text-white">
                {trainingResult.dataset_summary?.total_rows?.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {trainingResult.dataset_summary?.features?.length} Extracted Features
              </span>
            </div>
          </div>

          {/* Model Comparison Table & Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Comparison Table */}
            <div className="lg:col-span-7 bg-[#111622] border border-[#1e2638] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span>Side-by-Side Algorithm Benchmark</span>
                <span className="text-xs font-normal text-slate-400 font-mono">Stratified Holdout Evaluation</span>
              </h3>

              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c1017] text-slate-400 border-b border-[#1e2638]">
                  <tr>
                    <th className="p-3 font-bold">Metric</th>
                    <th className="p-3 font-bold text-purple-400">Random Forest</th>
                    <th className="p-3 font-bold text-indigo-400">XGBoost</th>
                    <th className="p-3 font-bold text-right">Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638] text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-white">ROC-AUC Score</td>
                    <td className="p-3 font-mono">{trainingResult.rf_metrics?.roc_auc}</td>
                    <td className="p-3 font-mono font-bold text-indigo-400">{trainingResult.xgb_metrics?.roc_auc}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {trainingResult.comparison?.xgb_auc_delta >= 0 ? `+${trainingResult.comparison?.xgb_auc_delta}` : trainingResult.comparison?.xgb_auc_delta}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">F1-Score</td>
                    <td className="p-3 font-mono">{trainingResult.rf_metrics?.f1}%</td>
                    <td className="p-3 font-mono font-bold text-indigo-400">{trainingResult.xgb_metrics?.f1}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {trainingResult.comparison?.xgb_f1_delta >= 0 ? `+${trainingResult.comparison?.xgb_f1_delta}%` : `${trainingResult.comparison?.xgb_f1_delta}%`}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Precision</td>
                    <td className="p-3 font-mono">{trainingResult.rf_metrics?.precision}%</td>
                    <td className="p-3 font-mono">{trainingResult.xgb_metrics?.precision}%</td>
                    <td className="p-3 text-right text-slate-400">Low False Positives</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Recall (Sensitivity)</td>
                    <td className="p-3 font-mono">{trainingResult.rf_metrics?.recall}%</td>
                    <td className="p-3 font-mono">{trainingResult.xgb_metrics?.recall}%</td>
                    <td className="p-3 text-right text-slate-400">High Fraud Catch Rate</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Accuracy</td>
                    <td className="p-3 font-mono">{trainingResult.rf_metrics?.accuracy}%</td>
                    <td className="p-3 font-mono">{trainingResult.xgb_metrics?.accuracy}%</td>
                    <td className="p-3 text-right text-slate-400">Overall Correctness</td>
                  </tr>
                </tbody>
              </table>

              {/* Confusion Matrix Breakdown */}
              <div className="mt-6 pt-5 border-t border-[#1e2638]">
                <h4 className="text-xs font-bold text-slate-300 mb-3">XGBoost Test Confusion Matrix</h4>
                <div className="grid grid-cols-2 gap-3 font-mono text-center">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">True Negatives (Legit Correct)</span>
                    <span className="text-base font-bold text-emerald-400">
                      {trainingResult.xgb_metrics?.confusion_matrix?.[0]?.[0] || '—'}
                    </span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">False Positives (Type I Error)</span>
                    <span className="text-base font-bold text-red-400">
                      {trainingResult.xgb_metrics?.confusion_matrix?.[0]?.[1] || 0}
                    </span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">False Negatives (Missed Fraud)</span>
                    <span className="text-base font-bold text-amber-400">
                      {trainingResult.xgb_metrics?.confusion_matrix?.[1]?.[0] || 0}
                    </span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">True Positives (Fraud Caught)</span>
                    <span className="text-base font-bold text-indigo-400">
                      {trainingResult.xgb_metrics?.confusion_matrix?.[1]?.[1] || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Top Predictive Features */}
            <div className="lg:col-span-5 bg-[#111622] border border-[#1e2638] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Top Predictive Fraud Features</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Signals with highest Gini / Gain contribution extracted from your dataset:
                </p>

                <div className="space-y-3">
                  {(trainingResult.xgb_metrics?.top_features || []).slice(0, 6).map((feat, i) => (
                    <div key={feat.feature} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-slate-300 font-medium truncate max-w-[200px]">
                          {i + 1}. {feat.feature}
                        </span>
                        <span className="font-mono text-indigo-400 font-bold">
                          {(feat.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#0c1017] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(8, feat.importance * 200))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e2638] flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Live model hot-reloaded and verified against active threat mesh.</span>
              </div>
            </div>
          </div>

          {/* Live Inference Sandbox */}
          <div className="bg-[#111622] border border-[#1e2638] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Inference Sandbox — Test Newly Trained Model</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pass test feature values to evaluate how your new model performs on unseen transaction inputs in real-time:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">indegree (fan-in)</label>
                <input
                  type="number"
                  value={testFeatures.indegree}
                  onChange={(e) => setTestFeatures(prev => ({ ...prev, indegree: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono">outdegree (fan-out)</label>
                <input
                  type="number"
                  value={testFeatures.outdegree}
                  onChange={(e) => setTestFeatures(prev => ({ ...prev, outdegree: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono">in_btc / amount</label>
                <input
                  type="number"
                  step="0.1"
                  value={testFeatures.in_btc}
                  onChange={(e) => setTestFeatures(prev => ({ ...prev, in_btc: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono">in_malicious (0 or 1)</label>
                <select
                  value={testFeatures.in_malicious}
                  onChange={(e) => setTestFeatures(prev => ({ ...prev, in_malicious: parseInt(e.target.value) }))}
                  className="w-full bg-[#0c1017] border border-[#232e44] rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value={0}>0 (Clean Sender)</option>
                  <option value={1}>1 (Malicious Sender)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRunTestPrediction}
                disabled={isPredicting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                {isPredicting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Evaluate with Active Model</span>
              </button>

              {predictionResult && (
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-mono text-xs ${
                  predictionResult.is_fraud
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  <span className="font-bold">
                    {predictionResult.is_fraud ? '🚨 CLASSIFIED AS FRAUD' : '✓ CLASSIFIED AS LEGITIMATE'}
                  </span>
                  <span>Probability: {(predictionResult.ml_fraud_prob * 100).toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-400">
                    (XGB: {(predictionResult.xgb_prob * 100).toFixed(1)}%, RF: {(predictionResult.rf_prob * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
