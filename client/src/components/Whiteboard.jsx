import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ArrowLeft, Users, Link2, Send, MessageSquare, BookOpen, Pin, Loader2, AlertCircle } from 'lucide-react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import roomWS from '../services/websocket';
import { fetchRoomById } from '../services/roomApi';

const getGuestName = () => {
  let name = sessionStorage.getItem('trace_guest_name');
  if (!name) {
    name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      length: 2,
      style: 'capital'
    });
    sessionStorage.setItem('trace_guest_name', name);
  }
  return name;
};

export default function Whiteboard({ room, onBack, user, onNavigate }) {
  const displayName = user?.name || getGuestName();
  const { roomId } = useParams();
  const [currentRoom, setCurrentRoom] = useState(room && room.id === roomId ? room : null);
  const [loading, setLoading] = useState(!currentRoom);
  const [error, setError] = useState(null);

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCollabNotes, setShowCollabNotes] = useState(true);
  const [stickies, setStickies] = useState([]);
  const [newStickyText, setNewStickyText] = useState('');
  const [collaborators, setCollaborators] = useState(new Map());

  const lastElementsRef = useRef(new Map());
  const pendingChangesRef = useRef({ created: {}, updated: {}, deleted: {} });
  const flushTimeoutRef = useRef(null);

  const handleMount = (api) => {
    setExcalidrawAPI(api);
  };

  useEffect(() => {
    if (room && room.id === roomId) {
      setCurrentRoom(room);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const loadRoom = async () => {
      try {
        setLoading(true);
        setError(null);
        if (roomId.startsWith('guest-')) {
          if (active) {
            setCurrentRoom({
              id: roomId,
              name: 'Guest Sketchbook',
              updated: 'Just now',
              members: ['G'],
              gridType: 'grid'
            });
            setLoading(false);
          }
        } else {
          const fetched = await fetchRoomById(roomId);
          if (active) {
            setCurrentRoom(fetched);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[Whiteboard Load Error]', err);
        if (active) {
          setError(err.response?.data?.error || 'Could not trace the sketchbook page!');
          setLoading(false);
        }
      }
    };

    loadRoom();
    return () => {
      active = false;
    };
  }, [roomId, room]);

  useEffect(() => {
    if (!currentRoom) return;

    roomWS.connect(currentRoom.id);

    const unsubSnapshot = roomWS.subscribe('SNAPSHOT_INIT', ({ records, chatHistory }) => {
      roomWS.send('PRESENCE', {
        presence: {
          pointer: null,
          username: displayName,
        },
      });

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
      if (chatHistory) {
        setStickies(chatHistory);
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
          Object.keys(deleted).forEach((id) => {
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

    const unsubLeave = roomWS.subscribe('USER_LEAVE', ({ userId }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    const unsubChat = roomWS.subscribe('CHAT_MESSAGE', (payload) => {
      setStickies((prev) => [
        ...prev,
        {
          id: payload.id || payload.timestamp || Date.now(),
          author: payload.author || `Designer ${payload.userId.substring(0, 4)}`,
          text: payload.text,
          color: payload.color || 'bg-accent/10',
        },
      ]);
    });

    return () => {
      unsubSnapshot();
      unsubDiff();
      unsubPresence();
      unsubLeave();
      unsubChat();
      roomWS.disconnect();
      clearTimeout(flushTimeoutRef.current);
    };
  }, [currentRoom?.id, excalidrawAPI]);

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
    const sceneCoords = excalidrawAPI.viewportCoordsToSceneCoords({
      clientX: e.clientX,
      clientY: e.clientY,
    });
    if (sceneCoords) {
      roomWS.send('PRESENCE', {
        presence: {
          pointer: { x: sceneCoords.x, y: sceneCoords.y },
          username: displayName,
        },
      });
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${currentRoom?.id || 'ws-1'}`);
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
      author: displayName,
      text: newStickyText.trim(),
      color: randomColor,
    };
    setStickies([...stickies, sticky]);
    roomWS.send('CHAT_MESSAGE', {
      text: sticky.text,
      author: sticky.author,
      color: sticky.color,
    });
    setNewStickyText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-paper bg-notebook font-sketch text-2xl text-ink animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
        TRACING SKETCHBOOK...
      </div>
    );
  }

  if (error) {
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

        {/* Error Card */}
        <div className="w-full max-w-md bg-white border-sketchy shadow-sketchy p-8 relative animate-paper text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-2deg] opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
            ★ tape_02
          </div>

          <div className="flex justify-center text-accent mb-4">
            <AlertCircle size={48} className="stroke-[1.5]" />
          </div>

          <h2 className="font-sketch text-2xl font-bold text-ink mb-2">PAGE NOT FOUND</h2>
          
          <p className="font-hand text-ink-muted text-base mb-6 leading-relaxed">
            {error || 'This sketchbook page has been torn out, deleted, or you might not have access to it.'}
          </p>

          <button
            onClick={onBack}
            className="btn-sketchy bg-white text-ink flex items-center justify-center gap-2 py-3 w-full"
          >
            <ArrowLeft size={18} /> GO BACK
          </button>
        </div>
      </div>
    );
  }

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
              <BookOpen size={20} /> {currentRoom?.name || 'Sketchbook Session'}
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
              <div className="w-8 h-8 rounded-full border border-ink bg-accent text-white flex items-center justify-center text-xs font-bold" title={`${displayName} (You)`}>
                {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              {Array.from(collaborators.entries()).map(([collabId, collab], idx) => {
                const name = collab.username || 'Guest';
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const colors = ['bg-accent-cyan', 'bg-accent-green'];
                const colorClass = colors[idx % colors.length];
                return (
                  <div
                    key={collabId}
                    className={`w-8 h-8 rounded-full border border-ink ${colorClass} text-white flex items-center justify-center text-xs font-bold`}
                    title={name}
                  >
                    {initials}
                  </div>
                );
              })}
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
