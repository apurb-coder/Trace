import React, { useState } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';

export default function Signup({ onRegister, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Designer');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Scribble down all the details to register!');
      return;
    }
    setError('');
    onRegister({ email, name, role });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper bg-notebook p-6 relative overflow-hidden">
      {/* Hand-drawn spiral binding effect on the left for tablet viewports */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-6 hidden xl:flex">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-12 h-4 border-sketchy rounded-full bg-paper rotate-[-15deg] shadow-sm"></div>
        ))}
      </div>

      {/* Main Sketchbook Paper Card */}
      <div className="w-full max-w-md bg-white border-sketchy shadow-sketchy p-8 relative animate-paper">
        {/* Sticky masking tapes */}
        <div className="absolute -top-4 left-1/4 w-24 h-7 bg-[#f1ebd9]/70 border-t border-b border-[#e6deca] rotate-[-4deg] opacity-80 shadow-sm pointer-events-none"></div>
        <div className="absolute -bottom-3 right-8 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[1.5deg] opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
          ★ tape_02
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-sketch text-4xl md:text-5xl text-ink font-bold tracking-tight inline-block relative">
            JOIN TRACE
            <span className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/80 to-accent-cyan/0 rounded-full"></span>
          </h1>
          <p className="font-hand text-ink-muted text-base mt-3">
            Open a blank sketchbook page.
          </p>
        </div>

        {error && (
          <div className="mb-6 border-sketchy-thin border-accent text-accent bg-accent/5 p-4 text-sm font-hand rounded flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-1.5">
              Draft Name (Display Name)
            </label>
            <input
              type="text"
              placeholder="e.g., Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full input-sketchy font-hand text-base"
              required
            />
          </div>

          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-1.5">
              Drafting Ink (Email)
            </label>
            <input
              type="email"
              placeholder="e.g., ada@trace.draw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-sketchy font-hand text-base"
              required
            />
          </div>

          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-1.5">
              What do you sketch? (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full input-sketchy font-hand text-base bg-white appearance-none cursor-pointer"
            >
              <option value="Designer">Designer / Architect</option>
              <option value="Engineer">Engineer / Developer</option>
              <option value="Educator">Educator / Teacher</option>
              <option value="Student">Student / Learner</option>
              <option value="Visual Thinker">Visual Thinker / Dreamer</option>
            </select>
          </div>

          <div>
            <label className="block font-hand text-sm font-semibold text-ink mb-1.5">
              Secret Sketch (Password)
            </label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-sketchy font-hand text-base"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full btn-sketchy btn-sketchy-cyan text-lg flex items-center justify-center gap-2 py-3 shadow-sketchy"
            >
              <UserPlus size={20} /> CREATE FREE ACCOUNT
            </button>
          </div>
        </form>

        <div className="relative my-6 text-center">
          <hr className="border-t-2 border-dashed border-ink/20" />
        </div>

        <div className="text-center font-hand text-sm">
          <span className="text-ink-muted">Already a collaborator? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-accent font-bold hover:underline"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}
