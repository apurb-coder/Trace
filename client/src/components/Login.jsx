import React, { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('collab@trace.draw');
  const [password, setPassword] = useState('sketch123');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all sketchy fields!');
      return;
    }
    setError('');
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError.message || 'Invalid secret sketch or ink!');
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper bg-notebook p-6 relative overflow-hidden">
      {/* Hand-drawn decorative doodles */}
      <svg className="absolute top-10 left-10 w-24 h-24 text-accent opacity-20 pointer-events-none hidden md:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M10,80 Q30,10 80,20 T90,90" />
        <path d="M75,15 L85,20 L80,30" />
      </svg>
      <svg className="absolute bottom-12 right-12 w-32 h-32 text-accent-cyan opacity-20 pointer-events-none hidden md:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="50" cy="50" r="35" strokeDasharray="5,5" />
        <path d="M50,15 L50,85 M15,50 L85,50" />
      </svg>

      {/* Main Sketchbook Paper Card */}
      <div className="w-full max-w-md bg-white border-sketchy shadow-sketchy p-8 relative animate-paper">
        {/* Decorative Sticky Tape at the top */}
        <div className="absolute -top-3 left-1/3 -translate-x-1/2 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-2deg] opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
          ★ tape_01
        </div>
        <div className="absolute -top-4 right-1/4 w-20 h-7 bg-[#f1ebd9]/60 border-t border-b border-[#e6deca] rotate-[3deg] opacity-80 shadow-sm pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-sketch text-5xl md:text-6xl text-ink font-bold tracking-tight inline-block relative">
            TRACE
            <span className="absolute -bottom-2 left-0 w-full h-3 bg-gradient-to-r from-accent/0 via-accent/80 to-accent/0 rounded-full"></span>
          </h1>
          <p className="font-hand text-ink-muted text-base mt-4">
            the collaborative whiteboard space
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 border-sketchy-thin border-accent text-accent bg-accent/5 p-4 text-sm font-hand rounded flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-2">
              Your Ink (Email)
            </label>
            <input
              type="email"
              placeholder="e.g., you@workspace.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-sketchy font-hand text-base"
              required
            />
          </div>

          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-2">
              Secret Sketch (Password)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-sketchy font-hand text-base"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm font-hand">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-accent w-4 h-4 cursor-pointer" defaultChecked />
              <span className="text-ink-muted">Keep me signed in</span>
            </label>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-accent-cyan hover:underline decoration-wavy cursor-pointer bg-transparent border-none p-0 font-hand"
            >
              Forgot pass?
            </button>
          </div>

          <button
            type="submit"
            className="w-full btn-sketchy btn-sketchy-accent text-lg flex items-center justify-center gap-2 py-3 shadow-sketchy"
          >
            <LogIn size={20} /> ENTER WORKSPACE
          </button>
        </form>

        {/* Sketchy Divider */}
        <div className="relative my-8 text-center">
          <hr className="border-t-2 border-dashed border-ink/20" />
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 font-hand text-sm text-ink-muted">
            or register
          </span>
        </div>

        <div className="text-center font-hand text-sm">
          <span className="text-ink-muted">Need a drawing pad? </span>
          <button
            onClick={() => onNavigate('signup')}
            className="text-accent font-bold hover:underline underline-sketchy decoration-2"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
