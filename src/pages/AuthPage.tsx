import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Github, Chrome, ArrowLeft, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      setError('');
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      console.log(`[AuthPage] Submitting ${isLogin ? 'Login' : 'Register'} for:`, form.email);
      
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          email: form.email,
          password: form.password,
          username: form.username || form.email.split('@')[0],
          displayName: form.displayName || form.username,
        });
      }
      console.log('[AuthPage] Auth success, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('[AuthPage] Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="glass-dark p-8 rounded-3xl border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl vibe-gradient flex items-center justify-center mb-4">
              <Terminal className="text-brand-secondary w-7 h-7" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Join the Lab'}
            </h1>
            <p className="text-slate-400 mt-2 text-center text-sm">
              {isLogin
                ? 'Continue your journey through the code vibe.'
                : 'Create an account to start tracking your progress.'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
            <button className="w-full h-12 rounded-xl bg-[#24292e] text-white font-bold flex items-center justify-center gap-3 hover:bg-black transition-colors">
              <Github className="w-5 h-5" />
              <span>Continue with Github</span>
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#020617] px-2 text-slate-500">Or continue with email</span></div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.displayName}
                    onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-primary outline-none transition-colors"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-primary outline-none transition-colors"
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="alex"
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-primary outline-none transition-colors"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-primary outline-none transition-colors"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl vibe-gradient text-brand-secondary font-bold hover:shadow-[0_0_20px_rgba(0,255,156,0.2)] transition-all mt-4 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already member?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-primary font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
