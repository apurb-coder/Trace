import React, { useState } from 'react';
import { User, Shield, PenTool, Check, ArrowLeft, Activity } from 'lucide-react';

const AVATARS = ['✏️', '🎨', '📐', '🧠', '🔬', '💡', '🎒', '🚀'];

export default function Profile({ user, onUpdateUser, onNavigate }) {
  const [name, setName] = useState(user?.name || 'Apurb');
  const [email, setEmail] = useState(user?.email || 'collab@trace.draw');
  const [role, setRole] = useState(user?.role || 'Engineer');
  const [avatar, setAvatar] = useState(user?.avatar || '✏️');
  const [bio, setBio] = useState('Drafting new ideas and system designs, one whiteboard at a time.');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateUser({ name, email, role, avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-paper bg-notebook text-ink p-4 sm:p-8 font-hand">
      {/* Header bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <button
          onClick={() => onNavigate('workspace')}
          className="btn-sketchy bg-white text-ink flex items-center gap-2 hover:translate-x-[-2px]"
        >
          <ArrowLeft size={18} /> BACK TO DRAWINGS
        </button>
        <div className="text-right">
          <span className="text-xs font-mono uppercase bg-accent-cyan/15 text-accent-cyan border-sketchy-thin px-2 py-0.5 rounded">
            Profile Settings
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="bg-white border-sketchy shadow-sketchy p-6 flex flex-col items-center text-center animate-paper">
          <div className="w-24 h-24 rounded-full border-3 border-ink bg-paper flex items-center justify-center text-5xl mb-4 shadow-sm relative">
            <span>{avatar}</span>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-ink bg-accent text-white flex items-center justify-center text-xs">
              ★
            </div>
          </div>
          <h2 className="font-sketch text-2xl font-bold mb-1">{name}</h2>
          <span className="bg-ink/5 border-sketchy-thin px-3 py-1 text-sm text-ink-muted inline-block mb-4">
            {role}
          </span>
          <p className="text-sm text-ink-muted italic mb-6">"{bio}"</p>

          <div className="w-full border-t border-dashed border-ink/20 pt-6 space-y-4">
            <h3 className="text-left font-sketch text-lg font-bold mb-2">📊 Sketchy Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-sketchy-thin bg-paper p-3 text-center rounded">
                <span className="block text-2xl font-bold text-accent">82</span>
                <span className="text-xs text-ink-muted uppercase">Doodles</span>
              </div>
              <div className="border-sketchy-thin bg-paper p-3 text-center rounded">
                <span className="block text-2xl font-bold text-accent-cyan">14.5h</span>
                <span className="text-xs text-ink-muted uppercase">Canvas Time</span>
              </div>
            </div>
            <div className="text-xs text-ink-muted flex items-center gap-2 justify-center pt-2">
              <Activity size={14} className="text-accent-green" /> Joined Trace: Jan 2026
            </div>
          </div>
        </div>

        {/* Profile Editing Form */}
        <div className="md:col-span-2 bg-white border-sketchy shadow-sketchy p-6 sm:p-8 relative animate-paper">
          {/* Masking tape details */}
          <div className="absolute -top-3 right-1/4 w-20 h-6 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[2deg] opacity-80 pointer-events-none"></div>

          <h2 className="font-sketch text-3xl font-bold mb-6 text-ink flex items-center gap-2">
            ⚙️ Edit Sketchbook settings
          </h2>

          {saved && (
            <div className="mb-6 border-sketchy-thin border-accent-green text-accent-green bg-accent-green/5 p-4 text-sm rounded flex items-center gap-2">
              <Check size={18} />
              <span>Sketchbook page updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Select */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-3">
                Choose Avatar Emblem
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`h-12 border-sketchy-thin text-2xl flex items-center justify-center transition-all ${
                      avatar === av
                        ? 'bg-accent/20 border-accent scale-105 shadow-sm'
                        : 'bg-paper hover:bg-white hover:scale-102'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input-sketchy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Drafting Ink (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-sketchy"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Your Main Discipline (Role)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full input-sketchy bg-white appearance-none cursor-pointer"
              >
                <option value="Designer">Designer / Architect</option>
                <option value="Engineer">Engineer / Developer</option>
                <option value="Educator">Educator / Teacher</option>
                <option value="Student">Student / Learner</option>
                <option value="Visual Thinker">Visual Thinker / Dreamer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Short bio / Scribble
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full input-sketchy font-hand resize-none"
                placeholder="Write a tiny scribble about yourself..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="btn-sketchy btn-sketchy-accent text-white flex items-center gap-2 py-3 px-6 shadow-sketchy"
              >
                💾 SAVE SKETCHBOOK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
