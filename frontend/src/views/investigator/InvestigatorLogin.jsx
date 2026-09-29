import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const InvestigatorLogin = () => {
  const { loginInvestigator } = useAuth();

  const [formData, setFormData] = useState({
    organization_id: 'CYBER-INTEL-HQ',
    investigator_id: 'investigator@agency.gov',
    password: 'Shield@2026',
    otp_code: '123456',
    remember_me: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.investigatorLogin(formData);
      loginInvestigator(result.user, result.access_token);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials and OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b11] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background grid decoration */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Glow balls */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CryptoShield</h1>
          <p className="text-sm text-indigo-400 font-medium mt-0.5">Investigation Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111622] border border-[#1e2638] rounded-3xl p-8 shadow-2xl shadow-black/60">
          <div className="mb-6 text-center">
            <h2 className="text-base font-bold text-white mb-0.5">Investigator Login</h2>
            <p className="text-xs text-slate-500">Authorized Access Only</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Organization ID */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Organization ID</label>
              <input
                type="text"
                required
                value={formData.organization_id}
                onChange={e => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
                className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 transition text-xs"
                placeholder="CYBER-INTEL-HQ"
              />
            </div>

            {/* Investigator ID */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Investigator ID / Email</label>
              <input
                type="text"
                required
                value={formData.investigator_id}
                onChange={e => setFormData(prev => ({ ...prev, investigator_id: e.target.value }))}
                className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 transition text-xs"
                placeholder="investigator@agency.gov"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-xs"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* OTP */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-400 font-semibold">OTP / 2FA Code</label>
                <span className="text-[10px] text-indigo-400">Demo OTP: 123456</span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.otp_code}
                onChange={e => setFormData(prev => ({ ...prev, otp_code: e.target.value }))}
                className="w-full bg-[#161c2b] border border-[#232e44] rounded-xl px-3.5 py-2.5 text-white font-mono tracking-widest text-center text-sm font-bold focus:outline-none focus:border-indigo-500 transition"
                placeholder="● ● ● ● ● ●"
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
              <div
                onClick={() => setFormData(prev => ({ ...prev, remember_me: !prev.remember_me }))}
                className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer ${
                  formData.remember_me ? 'bg-indigo-500 border-indigo-500' : 'border-[#232e44]'
                }`}
              >
                {formData.remember_me && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs">Remember me on this device</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Login — Secure Portal
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-5 pt-4 border-t border-[#1e2638] flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p>All activities are logged, monitored, and cryptographically anchored under agency cybercrime enforcement policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
