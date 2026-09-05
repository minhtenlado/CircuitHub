'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, ArrowLeft, Lock, Mail } from 'lucide-react';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function AdminLoginView() {
  const setView = useNavStore.getState().setView;
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        const role = json.data.user.role;
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          useAuthStore.getState().setAuth(json.data.user, json.data.token);
          toast({ title: 'Admin access granted', description: 'Welcome to the admin control panel.' });
          setView('admin', {});
        } else {
          toast({ title: 'Access denied', description: 'Admin credentials required.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Authentication failed', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(6,182,212,0.5)]">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">Admin Control Panel</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Authorized personnel only</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Tài khoản / Email Admin
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin hoặc admin@circuithub.vn"
                className="w-full h-11 px-4 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-4 w-4" />}
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setView('home', {})}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to marketplace
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
