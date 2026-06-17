import React, { useState } from 'react';
import { AlertCircle, Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please ink your email address first!');
      return;
    }
    setError('');
    setStatus('loading');

    // Simulate sending reset link with a hand-drawn feel delay
    setTimeout(() => {
      setStatus('success');
    }, 1800);
  };

  const handleResend = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
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
      {/* Hand-drawn spiral binding effect on the left for tablet viewports */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-6 hidden xl:flex">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-12 h-4 border-sketchy rounded-full bg-paper rotate-[-15deg] shadow-sm"></div>
        ))}
      </div>

      {/* Main Sketchbook Paper Card */}
      <div className="w-full max-w-md bg-white border-sketchy shadow-sketchy p-8 relative animate-paper">
        {/* Sticky masking tapes */}
        <div className="absolute -top-3 left-1/3 -translate-x-1/2 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-2deg] opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
          ★ tape_forgot
        </div>
        <div className="absolute -bottom-3 right-8 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[1.5deg] opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
          ★ page_404
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-sketch text-4xl md:text-5xl text-ink font-bold tracking-tight inline-block relative">
            RECOVER INK
            <span className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-accent/0 via-accent/80 to-accent/0 rounded-full"></span>
          </h1>
          <p className="font-hand text-ink-muted text-base mt-3">
            Lost your key? Let's redraw a new one.
          </p>
        </div>

        {status === 'idle' && (
          <>
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
                  Your Ink Address (Email)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g., your@workspace.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-sketchy font-hand text-base pl-11"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                </div>
                <p className="text-xs text-ink-muted mt-2 font-hand leading-relaxed">
                  We will send a sketchy password reset link to this email.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-sketchy btn-sketchy-accent text-lg flex items-center justify-center gap-2 py-3 shadow-sketchy"
              >
                <Send size={18} className="rotate-[-20deg]" /> SEND RESET LINK
              </button>
            </form>
          </>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            {/* Draw a hand-drawn pencil/pen spinning or bouncing animation */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Sketchy spinning circle */}
              <svg className="animate-spin w-20 h-20 text-accent" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="50, 60" fill="none" strokeLinecap="round" />
              </svg>
              {/* Paper airplane icon in the center */}
              <div className="absolute animate-bounce">
                <Send size={28} className="text-accent-cyan rotate-[-20deg]" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-sketch text-2xl text-ink font-bold">Inking your trail...</h3>
              <p className="font-hand text-ink-muted text-sm max-w-xs mx-auto">
                Folding a digital paper airplane and launching it into the cloud grid.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Success Badge */}
              <div className="w-20 h-20 rounded-full border-sketchy bg-accent-green/10 flex items-center justify-center text-accent-green relative animate-paper shadow-sketchy-accent">
                <CheckCircle size={40} />
                {/* Hand-drawn mini star doodle */}
                <svg className="absolute -top-1 -right-2 w-6 h-6 text-accent animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12,2 L15,9 L22,9 L17,14 L19,21 L12,17 L5,21 L7,14 L2,9 L9,9 Z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="font-sketch text-3xl text-ink font-bold">Reset Link Sent!</h3>
                <p className="font-clean text-ink text-sm leading-relaxed max-w-sm">
                  We've successfully launched a paper airplane reset link to:
                  <br />
                  <span className="font-hand font-semibold text-accent-cyan break-all">{email}</span>
                </p>
              </div>
            </div>

            <div className="border-sketchy-thin border-dashed bg-paper p-4 rounded text-center">
              <p className="text-xs text-ink-muted font-hand leading-relaxed">
                Didn't get the airplane? Check your spam folder or let us fold another one.
              </p>
              <button
                onClick={handleResend}
                className="mt-3 text-xs font-bold font-hand text-accent hover:underline decoration-wavy"
              >
                Fold and send again
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('login')}
                className="w-full btn-sketchy text-lg flex items-center justify-center gap-2 py-3 shadow-sketchy"
              >
                BACK TO LOGIN
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        {status !== 'loading' && (
          <div className="relative my-6 text-center">
            <hr className="border-t-2 border-dashed border-ink/20" />
          </div>
        )}

        {/* Back Link */}
        {status !== 'success' && (
          <div className="text-center">
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-2 font-hand text-sm text-ink-muted hover:text-ink hover:underline decoration-wavy transition-colors"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
