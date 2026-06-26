import React, { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ArrowLeft, Users, Link2, Send, MessageSquare, BookOpen, Pin } from 'lucide-react';
import roomWS from '../services/websocket';

export default function Whiteboard({ room, onBack, user, onNavigate }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCollabNotes, setShowCollabNotes] = useState(true);
  const [stickies, setStickies] = useState([
    { id: 1, author: 'Ada', text: 'Added the layout architecture sketch!', color: 'bg-accent-cyan/10' },
    { id: 2, author: 'Kai', text: 'Make sure we keep the whiteboard canvas clean and fast.', color: 'bg-accent/10' }
  ]);
  const [newStickyText, setNewStickyText] = useState('');
  const [collaborators, setCollaborators] = useState(new Map());

  const lastElementsRef = useRef(new Map());
  const pendingChangesRef = useRef({ created: {}, updated: {}, deleted: {} });
  const flushTimeoutRef = useRef(null);

  const handleMount = (api) => {
    setExcalidrawAPI(api);
  };

  useEffect(() => {
    roomWS.connect(room.id);

    const unsubSnapshot = roomWS.subscribe('SNAPSHOT_INIT', ({ records }) => {
      if (excalidrawAPI) {
        const elements = Object.values(records || {});
        lastElementsRef.current.clear();
        elements.forEach((el) => {
          lastElementsRef.current.set(el.id, { version: el.version, isDeleted: el.isDeleted });
        });
        excalidrawAPI.updateScene({
          elements,
          commitToHistory: false,
        });
      }
    });

    const unsubDiff = roomWS.subscribe('STORE_DIFF', ({ diff }) => {
      if (excalidrawAPI) {
        const currentElements = excalidrawAPI.getSceneElements();
        const elementsMap = new Map(currentElements.map((el) => [el.id, el]));
        const { created, updated, deleted } = diff;

        if (created) {
          Object.entries(created).forEach(([id, element]) => {
            elementsMap.set(id, element);
            lastElementsRef.current.set(id, { version: element.version, isDeleted: element.isDeleted });
          });
        }
        if (updated) {
          Object.entries(updated).forEach(([id, change]) => {
            const existing = elementsMap.get(id);
            if (existing) {
              const updatedEl = Array.isArray(change)
                ? { ...existing, ...change[1] }
                : { ...existing, ...change };
              elementsMap.set(id, updatedEl);
              lastElementsRef.current.set(id, { version: updatedEl.version, isDeleted: updatedEl.isDeleted });
            }
          });
        }
        if (deleted) {
          Object.entries(deleted).forEach(([id, element]) => {
            const existing = elementsMap.get(id);
            if (existing) {
              const deletedEl = { ...existing, isDeleted: true };
              elementsMap.set(id, deletedEl);
              lastElementsRef.current.set(id, { version: deletedEl.version, isDeleted: true });
            }
          });
        }

        excalidrawAPI.updateScene({
          elements: Array.from(elementsMap.values()),
          commitToHistory: false,
        });
      }
    });

    const unsubPresence = roomWS.subscribe('PRESENCE', ({ userId, presence }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.set(userId, {
          pointer: presence.pointer,
          username: presence.username,
          color: '#2baec4',
        });
        return next;
      });
    });

    const unsubChat = roomWS.subscribe('CHAT_MESSAGE', (payload) => {
      const colors = ['bg-accent/10', 'bg-accent-cyan/10', 'bg-accent-green/10'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setStickies((prev) => [
        ...prev,
        {
          id: payload.timestamp || Date.now(),
          author: `Designer ${payload.userId.substring(0, 4)}`,
          text: payload.text,
          color: randomColor,
        },
      ]);
    });

    return () => {
      unsubSnapshot();
      unsubDiff();
      unsubPresence();
      unsubChat();
      roomWS.disconnect();
      clearTimeout(flushTimeoutRef.current);
    };
  }, [room.id, excalidrawAPI]);

  const handleCanvasChange = (elements) => {
    let hasChanges = false;

    elements.forEach((el) => {
      const last = lastElementsRef.current.get(el.id);
      if (!last || last.version !== el.version || last.isDeleted !== el.isDeleted) {
        if (el.isDeleted) {
          pendingChangesRef.current.deleted[el.id] = el;
          delete pendingChangesRef.current.created[el.id];
          delete pendingChangesRef.current.updated[el.id];
        } else if (!last) {
          pendingChangesRef.current.created[el.id] = el;
          delete pendingChangesRef.current.deleted[el.id];
        } else {
          pendingChangesRef.current.updated[el.id] = el;
          delete pendingChangesRef.current.deleted[el.id];
        }
        hasChanges = true;
        lastElementsRef.current.set(el.id, { version: el.version, isDeleted: el.isDeleted });
      }
    });

    if (hasChanges) {
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(() => {
          const { created, updated, deleted } = pendingChangesRef.current;
          const diff = {};
          if (Object.keys(created).length > 0) diff.created = created;
          if (Object.keys(updated).length > 0) diff.updated = updated;
          if (Object.keys(deleted).length > 0) diff.deleted = deleted;

          if (Object.keys(diff).length > 0) {
            roomWS.send('STORE_DIFF', { diff });
          }

          pendingChangesRef.current = { created: {}, updated: {}, deleted: {} };
          flushTimeoutRef.current = null;
        }, 150);
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!excalidrawAPI) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sceneCoords = excalidrawAPI.viewportCoordsToSceneCoords({
      clientX: e.clientX,
      clientY: e.clientY,
    });
    if (sceneCoords) {
      roomWS.send('PRESENCE', {
        presence: {
          pointer: { x: sceneCoords.x, y: sceneCoords.y },
          username: user?.name || 'Guest',
        },
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
    const sticky = {
      id: Date.now(),
      author: user?.name || 'Guest',
      text: newStickyText.trim(),
      color: randomColor,
    };
    setStickies([...stickies, sticky]);
    roomWS.send('CHAT_MESSAGE', { text: sticky.text });
    setNewStickyText('');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-paper relative font-hand text-ink">
      
      {/* Top Header Overlay Bar (Sketchy styled book spine) */}
      <header className="z-10 flex items-center justify-between px-4 py-3 bg-white border-b-3 border-ink shadow-sm">
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={onBack}
              className="btn-sketchy bg-white text-ink py-1 px-3 flex items-center gap-1.5 text-sm shadow-sm"
            >
              <ArrowLeft size={16} /> WORKSPACE
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="btn-sketchy bg-white text-ink py-1 px-3 flex items-center gap-1.5 text-sm shadow-sm"
              >
                <ArrowLeft size={16} /> HOME
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="btn-sketchy bg-white text-ink py-1 px-3 flex items-center gap-1.5 text-sm shadow-sm"
              >
                SIGN IN
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="btn-sketchy btn-sketchy-cyan py-1 px-3 flex items-center gap-1.5 text-sm shadow-sm"
              >
                SIGN UP
              </button>
            </div>
          )}
          
          <div className="h-6 w-[2px] bg-ink/10 hidden md:block"></div>

          <div>
            <h1 className="font-sketch text-lg md:text-xl font-bold leading-none flex items-center gap-2">
              <BookOpen size={20} /> {room?.name || 'Sketchbook Session'}
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
            onClick={() => setShowCollabNotes(!showCollabNotes)}
            className={`btn-sketchy flex items-center gap-1.5 text-sm py-1.5 px-3 transition-colors ${
              showCollabNotes ? '!bg-accent !text-white border-ink' : 'bg-white text-ink'
            }`}
          >
            <MessageSquare size={16} /> {showCollabNotes ? 'HIDE NOTES' : 'SHOW NOTES'}
          </button>

          <button
            onClick={copyInvite}
            className={`btn-sketchy flex items-center gap-1.5 text-sm py-1.5 px-3 transition-colors ${
              copied ? '!bg-accent-green !text-white border-accent-green' : 'bg-white text-ink'
            }`}
          >
            <Link2 size={16} /> {copied ? 'COPIED!' : 'SHARE LINK'}
          </button>
        </div>
      </header>

      {/* Main Split Window */}
      <div className="flex-grow flex relative overflow-hidden">
        




        {/* Core Whiteboard Canvas (Sacred Canvas: Keep it clean and un-styled) */}
        <div className="flex-grow h-full w-full relative z-0" onPointerMove={handlePointerMove}>
          <Excalidraw
            excalidrawAPI={handleMount}
            theme="light"
            initialData={{
              appState: {
                viewBackgroundColor: "#faf8f5",
                currentItemStrokeColor: "#1c1a22",
                currentItemBackgroundColor: "transparent",
              }
            }}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: false,
                clearCanvas: false,
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
                saveAsImage: false,
              },
              welcomeScreen: false,
            }}
            onChange={handleCanvasChange}
            collaborators={collaborators}
          />
        </div>

        {/* Right Panel: Collaborative Lobby / Sticky Notes (Overlayed) */}
        <aside className={`absolute md:relative right-0 top-0 bottom-0 w-80 h-full bg-white border-l-3 border-ink flex flex-col z-20 shadow-lg shrink-0 transition-all duration-300 animate-paper ${
          showCollabNotes ? 'flex' : 'hidden'
        }`}>
          {/* Spine Binding tape header */}
          <div className="absolute top-2 -left-3 w-6 h-12 bg-[#f1ebd9] border border-[#e6deca] rotate-[-90deg] opacity-75 shadow-sm pointer-events-none"></div>

          <div className="p-4 border-b border-dashed border-ink/20 bg-paper">
            <h3 className="font-sketch text-lg font-bold flex items-center gap-2">
              <Pin size={18} /> Collaborative Notes
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
