import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1 = email form, 2 = token + new password

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResetToken(res.data.resetToken || '');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword });
      setSuccess('Password reset successfully! You can now login.');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-bold font-display text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            InterviewIQ
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">
            {step === 1 ? 'Reset your password' : 'Enter new password'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1 ? "We'll generate a reset token for you." : 'Enter the token and choose a new password.'}
          </p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                  />
                </div>
              </div>
              <button
                id="forgot-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Reset Token <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 2 && !success && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Reset Token</label>
                <textarea
                  id="reset-token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  placeholder="Paste reset token here..."
                  rows={3}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input
                  id="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <button
                id="reset-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
