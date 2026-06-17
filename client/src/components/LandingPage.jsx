import React from 'react';
import { PenTool, Users, LayoutGrid, LogIn, UserCircle2, ArrowRight } from 'lucide-react';

export default function LandingPage({ user, onNavigate, onStartGuestDrawing }) {
  return (
    <div className="min-h-screen bg-paper bg-notebook text-ink font-clean flex flex-col justify-between p-4 sm:p-6 md:p-8">
      
      {/* Top Header Navigation */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-sketchy bg-white p-4 mb-12 relative shadow-sketchy">
        {/* Binder spiral ring decoration on top header */}
        <div className="absolute -top-3 left-10 w-16 h-6 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-2deg] pointer-events-none"></div>
        
        {/* Logo */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="font-sketch text-3xl font-bold text-accent tracking-tight">trace</span>
          <span className="w-2.5 h-2.5 bg-accent-cyan rounded-full animate-pulse mt-3"></span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => onNavigate('workspace')}
              className="btn-sketchy flex items-center gap-2 text-sm py-2 px-4 bg-white"
            >
              <LayoutGrid size={16} /> WORKSPACE
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="btn-sketchy flex items-center gap-1.5 text-sm py-2 px-4 bg-white"
              >
                <LogIn size={16} /> SIGN IN
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="btn-sketchy btn-sketchy-cyan flex items-center gap-1.5 text-sm py-2 px-4"
              >
                REGISTER
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Body Content */}
      <main className="max-w-5xl w-full mx-auto flex-grow flex flex-col justify-center items-center text-center my-8">
        {/* Main Brand Statement */}
        <h1 className="font-sketch text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-ink mb-6 text-wrap-balance">
          The Collaborative <span className="text-accent underline-sketchy decoration-3">Sketchbook.</span>
        </h1>

        {/* Subhead with capped line-length */}
        <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-[65ch] mb-10 text-wrap-pretty font-hand">
          A tactile, hand-drawn workspace for teams to brainstorm, wireframe, and draw together in real-time. No barriers, no forced accounts.
        </p>

        {/* CTA Button Layout */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md">
          <button
            onClick={onStartGuestDrawing}
            className="btn-sketchy btn-sketchy-accent text-white py-3 px-8 text-lg flex items-center justify-center gap-2 shadow-sketchy"
          >
            <PenTool size={20} /> START DRAWING INSTANTLY
          </button>
          
          {user ? (
            <button
              onClick={() => onNavigate('workspace')}
              className="btn-sketchy bg-white py-3 px-8 text-lg flex items-center justify-center gap-2 shadow-sketchy"
            >
              MY WORKSPACE <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="btn-sketchy bg-white py-3 px-8 text-lg flex items-center justify-center gap-2 shadow-sketchy"
            >
              GO TO WORKSPACE <ArrowRight size={20} />
            </button>
          )}
        </div>

        {/* Features Layout: Rotated cards mimicking pages pinned to a board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-8 max-w-5xl">
          
          {/* Card 1 - Sketchy Rotated Left */}
          <div 
            className="bg-white border-sketchy shadow-sketchy p-6 flex flex-col items-center text-center rotate-[-1deg] hover:rotate-[0deg] hover:translate-y-[-4px] hover:shadow-sketchy-lg transition-all"
            style={{ borderRadius: '12px 24px 12px 18px / 18px 12px 24px 12px' }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-ink bg-accent/10 flex items-center justify-center text-accent mb-4">
              <PenTool size={24} />
            </div>
            <h3 className="font-sketch text-xl font-bold mb-2 text-ink">Zero Setup Friction</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Launch a sketchpad immediately. Draw, note, and wireframe without being forced to create an account.
            </p>
          </div>

          {/* Card 2 - Sketchy Rotated Right */}
          <div 
            className="bg-white border-sketchy shadow-sketchy p-6 flex flex-col items-center text-center rotate-[1.5deg] hover:rotate-[0deg] hover:translate-y-[-4px] hover:shadow-sketchy-lg transition-all"
            style={{ borderRadius: '18px 12px 24px 12px / 12px 24px 12px 18px' }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-ink bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-4">
              <Users size={24} />
            </div>
            <h3 className="font-sketch text-xl font-bold mb-2 text-ink">Real-time Collaboration</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Share your canvas room link. Draw together with live cursor tracking and shared note boards.
            </p>
          </div>

          {/* Card 3 - Sketchy Flat */}
          <div 
            className="bg-white border-sketchy shadow-sketchy p-6 flex flex-col items-center text-center rotate-[-0.5deg] hover:rotate-[0deg] hover:translate-y-[-4px] hover:shadow-sketchy-lg transition-all"
            style={{ borderRadius: '14px 18px 12px 24px / 20px 10px 18px 14px' }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-ink bg-accent-green/10 flex items-center justify-center text-accent-green mb-4">
              <LayoutGrid size={24} />
            </div>
            <h3 className="font-sketch text-xl font-bold mb-2 text-ink">Persistent Workspace</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Sign in to gain a dashboard. Manage multiple sketchbooks, track team updates, and save boards permanently.
            </p>
          </div>

        </div>
      </main>

      {/* Simple hand-drawn sketchbook footer */}
      <footer className="w-full text-center border-t border-dashed border-ink/20 pt-8 mt-12">
        <p className="font-hand text-sm text-ink-muted">
          Made with ink and paper &copy; {new Date().getFullYear()} Trace. All pages sketch-friendly.
        </p>
      </footer>

    </div>
  );
}
