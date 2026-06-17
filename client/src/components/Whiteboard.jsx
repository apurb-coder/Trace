import React, { useState, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { ArrowLeft, Users, Link2, Undo2, Redo2, Grid, Square, Circle, Type, Trash2, Send, Bookmark } from 'lucide-react';

export default function Whiteboard({ room, onBack, user }) {
  const [editor, setEditor] = useState(null);
  const [copied, setCopied] = useState(false);
  const [gridMode, setGridMode] = useState(true);
  const [stickies, setStickies] = useState([
    { id: 1, author: 'Ada', text: 'Added the layout architecture sketch!', color: 'bg-accent-cyan/10' },
    { id: 2, author: 'Kai', text: 'Make sure we keep the whiteboard canvas clean and fast.', color: 'bg-accent/10' }
  ]);
  const [newStickyText, setNewStickyText] = useState('');

  const handleMount = (editorInstance) => {
    setEditor(editorInstance);
    // Initialize default grid mode
    editorInstance.setGridMode(gridMode);
  };

  const toggleGrid = () => {
    if (editor) {
      const nextMode = !gridMode;
      setGridMode(nextMode);
      editor.setGridMode(nextMode);
    }
  };

  const handleUndo = () => {
    if (editor) editor.undo();
  };

  const handleRedo = () => {
    if (editor) editor.redo();
  };

  const handleClear = () => {
    if (editor && confirm('Wipe the entire sketchbook canvas?')) {
      editor.selectAll();
      const selected = editor.getSelectedShapeIds();
      if (selected.length > 0) {
        editor.deleteShapes(selected);
      } else {
        // Fallback: delete everything in the current page
        const allShapeIds = Array.from(editor.getCurrentPageShapeIds());
        editor.deleteShapes(allShapeIds);
      }
    }
  };

  const addCustomShape = (type) => {
    if (!editor) return;
    const { x, y } = editor.getViewportPageBounds();
    const centerX = x + 300;
    const centerY = y + 200;

    if (type === 'rect') {
      editor.createShape({
        type: 'geo',
        x: centerX,
        y: centerY,
        props: { geo: 'rectangle', w: 150, h: 100, text: 'Custom Rect' }
      });
    } else if (type === 'circle') {
      editor.createShape({
        type: 'geo',
        x: centerX,
        y: centerY,
        props: { geo: 'ellipse', w: 120, h: 120, text: 'Custom Circle' }
      });
    } else if (type === 'text') {
      editor.createShape({
        type: 'text',
        x: centerX,
        y: centerY,
        props: { text: 'Double click to edit text!' }
      });
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`https://trace.draw/room/${room?.id || 'ws-1'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const postSticky = (e) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;
    const colors = ['bg-accent/10', 'bg-accent-cyan/10', 'bg-accent-green/10'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setStickies([
      ...stickies,
      {
        id: Date.now(),
        author: user?.name || 'Apurb',
        text: newStickyText.trim(),
        color: randomColor
      }
    ]);
    setNewStickyText('');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-paper relative font-hand text-ink">
      
      {/* Top Header Overlay Bar (Sketchy styled book spine) */}
      <header className="z-10 flex items-center justify-between px-4 py-3 bg-white border-b-3 border-ink shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn-sketchy bg-white text-ink py-1 px-3 flex items-center gap-1 text-sm shadow-sm"
          >
            <ArrowLeft size={16} /> WORKSPACES
          </button>
          
          <div className="h-6 w-[2px] bg-ink/10 hidden md:block"></div>

          <div>
            <h1 className="font-sketch text-lg md:text-xl font-bold leading-none flex items-center gap-2">
              📖 {room?.name || 'Sketchbook Session'}
            </h1>
            <span className="text-xs text-accent font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              Live Synced Canvas
            </span>
          </div>
        </div>

        {/* Header Right (Collaborators & Share) */}
        <div className="flex items-center gap-4">
          <div className="items-center gap-2 hidden lg:flex">
            <span className="text-xs text-ink-muted flex items-center gap-1 font-semibold">
              <Users size={14} /> COLLABORATORS:
            </span>
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-full border border-ink bg-accent text-white flex items-center justify-center text-xs font-bold" title={`${user?.name} (You)`}>
                {user?.name?.substring(0,1).toUpperCase() || 'A'}
              </div>
              <div className="w-8 h-8 rounded-full border border-ink bg-accent-cyan text-white flex items-center justify-center text-xs font-bold" title="Ada">
                D
              </div>
              <div className="w-8 h-8 rounded-full border border-ink bg-accent-green text-white flex items-center justify-center text-xs font-bold" title="Kai">
                K
              </div>
            </div>
          </div>

          <button
            onClick={copyInvite}
            className={`btn-sketchy flex items-center gap-1.5 text-sm py-1.5 px-3 transition-colors ${
              copied ? 'bg-accent-green text-white border-accent-green' : 'bg-white text-ink'
            }`}
          >
            <Link2 size={16} /> {copied ? 'COPIED!' : 'SHARE LINK'}
          </button>
        </div>
      </header>

      {/* Main Split Window */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* Left Floating Panel: Sketchy Options */}
        <div className="absolute left-4 top-4 z-10 w-52 bg-white border-sketchy shadow-sketchy p-4 flex flex-col gap-4">
          <div>
            <h3 className="font-sketch text-sm font-bold border-b border-dashed border-ink/20 pb-1 mb-2">
              🗺️ CANVAS
            </h3>
            <button
              onClick={toggleGrid}
              className={`w-full py-1.5 px-2 text-xs border-sketchy-thin flex items-center justify-between transition-colors ${
                gridMode ? 'bg-accent/15 border-accent' : 'bg-paper'
              }`}
            >
              <span className="flex items-center gap-1"><Grid size={12} /> Toggle Grid</span>
              <span className="font-mono">{gridMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div>
            <h3 className="font-sketch text-sm font-bold border-b border-dashed border-ink/20 pb-1 mb-2">
              ⚙️ ADD SHAPES
            </h3>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => addCustomShape('rect')}
                className="p-1.5 border-sketchy-thin bg-paper hover:bg-accent/10 flex flex-col items-center justify-center text-[10px]"
                title="Add Rectangle"
              >
                <Square size={14} /> Rect
              </button>
              <button
                onClick={() => addCustomShape('circle')}
                className="p-1.5 border-sketchy-thin bg-paper hover:bg-accent/10 flex flex-col items-center justify-center text-[10px]"
                title="Add Circle"
              >
                <Circle size={14} /> Circle
              </button>
              <button
                onClick={() => addCustomShape('text')}
                className="p-1.5 border-sketchy-thin bg-paper hover:bg-accent/10 flex flex-col items-center justify-center text-[10px]"
                title="Add Text"
              >
                <Type size={14} /> Text
              </button>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="w-full btn-sketchy border-accent text-accent py-1.5 text-xs flex items-center justify-center gap-1 hover:bg-accent/5"
          >
            <Trash2 size={12} /> WIPE SELECTED
          </button>
        </div>

        {/* Bottom Floating Panel: Undo / Redo Snap Bar */}
        <div className="absolute left-4 bottom-4 z-10 flex gap-2">
          <button
            onClick={handleUndo}
            className="p-2 bg-white border-sketchy shadow-sketchy hover:bg-paper active:scale-95 transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 bg-white border-sketchy shadow-sketchy hover:bg-paper active:scale-95 transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>

        {/* Core Whiteboard Canvas (Sacred Canvas: Keep it clean and un-styled) */}
        <div className="flex-grow h-full w-full relative z-0">
          <Tldraw onMount={handleMount} />
        </div>

        {/* Right Panel: Collaborative Lobby / Sticky Notes (Overlayed) */}
        <aside className="w-80 h-full bg-white border-l-3 border-ink flex flex-col z-10 shadow-lg shrink-0 hidden md:flex animate-paper">
          {/* Spine Binding tape header */}
          <div className="absolute top-2 -left-3 w-6 h-12 bg-[#f1ebd9] border border-[#e6deca] rotate-[-90deg] opacity-75 shadow-sm pointer-events-none"></div>

          <div className="p-4 border-b border-dashed border-ink/20 bg-paper">
            <h3 className="font-sketch text-lg font-bold flex items-center gap-2">
              📌 Collaborative Notes
            </h3>
            <p className="text-xs text-ink-muted mt-1">Scribble messages to other designers on this room canvas.</p>
          </div>

          {/* Stickies List */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {stickies.map((sticky) => (
              <div
                key={sticky.id}
                className={`${sticky.color} border-sketchy-thin p-3 shadow-sm relative rotate-[0.5deg]`}
              >
                <span className="absolute -top-1.5 -left-1 text-xs bg-ink text-white px-1 font-mono rounded-xs uppercase scale-90">
                  {sticky.author}
                </span>
                <p className="text-sm pt-2 leading-relaxed">{sticky.text}</p>
              </div>
            ))}
          </div>

          {/* Send Form */}
          <form onSubmit={postSticky} className="p-4 border-t border-ink/10 bg-paper flex items-center gap-2">
            <input
              type="text"
              placeholder="Add sticky message..."
              value={newStickyText}
              onChange={(e) => setNewStickyText(e.target.value)}
              className="flex-grow input-sketchy text-xs py-2 pr-2"
              required
            />
            <button
              type="submit"
              className="p-2 border border-ink bg-accent text-white rounded hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <Send size={14} />
            </button>
          </form>
        </aside>

      </div>
    </div>
  );
}
