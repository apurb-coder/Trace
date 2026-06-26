import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Settings, LogOut, Trash2, Edit2, Play, Users, StickyNote, Wrench, PlusCircle, Rocket } from 'lucide-react';
import { getAvatarIcon } from '../utils/avatars';
import { fetchRooms, createRoom, updateRoom, deleteRoom } from '../services/roomApi';

export default function Workspace({ user, onSelectRoom, onLogout, onNavigate }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchRooms();
        if (active) setWorkspaces(data);
      } catch (err) {
        console.error('[Load Rooms Error]', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const room = await createRoom(newName.trim());
      setWorkspaces([room, ...workspaces]);
      setNewName('');
      setShowCreateModal(false);
      onSelectRoom(room);
    } catch (err) {
      console.error('[Create Room Error]', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to tear this sketchbook page?')) {
      try {
        await deleteRoom(id);
        setWorkspaces(workspaces.filter((w) => w.id !== id));
      } catch (err) {
        console.error('[Delete Room Error]', err);
      }
    }
  };

  const handleRename = (id, name, e) => {
    e.stopPropagation();
    setEditId(id);
    setEditName(name);
  };

  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      const updated = await updateRoom(editId, editName.trim());
      setWorkspaces(workspaces.map((w) => w.id === editId ? updated : w));
      setEditId(null);
    } catch (err) {
      console.error('[Rename Room Error]', err);
    }
  };

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-paper font-sketch text-2xl text-ink animate-pulse">
        LOADING ROOMS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper bg-notebook text-ink p-4 sm:p-8 font-hand">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-sketchy bg-white p-4 mb-8 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-ink bg-accent text-white flex items-center justify-center shadow-sm">
            {getAvatarIcon(user?.avatar || 'pencil', 24)}
          </div>
          <div>
            <h2 className="font-sketch text-xl md:text-2xl font-bold">
              Welcome back, <span className="text-accent underline-sketchy decoration-2">{user?.name || 'Apurb'}</span>!
            </h2>
            <p className="text-xs text-ink-muted">Active Role: {user?.role || 'Collaborator'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="btn-sketchy bg-white text-ink flex items-center gap-1.5 text-sm"
          >
            <Settings size={16} /> SETTINGS
          </button>
          <button
            onClick={onLogout}
            className="btn-sketchy bg-white border-accent text-accent flex items-center gap-1.5 text-sm hover:bg-accent/5"
          >
            <LogOut size={16} /> SIGN OUT
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side Info Panel */}
        <div className="lg:col-span-1 bg-white border-sketchy shadow-sketchy p-6 h-fit relative">
          <div className="absolute -top-3 left-10 w-16 h-6 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-3deg] pointer-events-none"></div>

          <h3 className="font-sketch text-lg font-bold mb-4 flex items-center gap-2">
            <StickyNote size={20} /> Quick Notes
          </h3>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Click on any canvas card to load the whiteboard workspace. We keep the whiteboard canvas clean and lag-free, but styled the framing around it with custom tactile scribbles.
          </p>

          <div className="border-t border-dashed border-ink/20 pt-6">
            <h4 className="font-sketch text-base font-bold mb-3 flex items-center gap-2"><Wrench size={18} /> Canvas Quick-Start</h4>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full btn-sketchy btn-sketchy-accent flex items-center justify-center gap-2 py-3"
            >
              <Plus size={18} /> NEW DRAWING PAD
            </button>
          </div>
        </div>

        {/* Right Side Workspaces Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search your sketchy rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-sketchy font-hand text-base pr-4 bg-white"
              style={{ paddingLeft: '3rem' }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={20} />
          </div>

          {/* Workspaces List */}
          {filtered.length === 0 ? (
            <div className="border-2 border-dashed border-ink/30 p-12 text-center rounded-lg bg-white/50">
              <p className="font-hand text-ink-muted text-lg">No sketchy rooms match your search query!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-sketchy btn-sketchy-cyan mt-4 inline-flex items-center gap-2"
              >
                <Plus size={18} /> CREATE ONE NOW
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => editId !== ws.id && onSelectRoom(ws)}
                  className="bg-white border-sketchy shadow-sketchy p-6 hover:translate-y-[-4px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_#1c1a22] transition-all cursor-pointer relative group flex flex-col justify-between min-h-[180px]"
                >
                  <div>
                    {/* Decorative tape on card */}
                    <div className="absolute top-2 right-4 w-12 h-4 bg-[#f1ebd9]/50 border border-[#e6deca] rotate-[5deg] opacity-60"></div>

                    {editId === ws.id ? (
                      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSaveRename} className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-sketchy font-hand text-sm py-1 flex-grow"
                          autoFocus
                        />
                        <button type="submit" className="btn-sketchy-thin bg-accent text-white px-2 text-xs">Save</button>
                        <button type="button" onClick={() => setEditId(null)} className="btn-sketchy-thin bg-white text-ink px-2 text-xs">X</button>
                      </form>
                    ) : (
                      <h4 className="font-sketch text-xl font-bold text-ink mb-2 group-hover:text-accent transition-colors flex items-center gap-2">
                        {ws.name}
                      </h4>
                    )}

                    <div className="flex items-center gap-4 text-xs text-ink-muted mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {ws.updatedAt ? new Date(ws.updatedAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer actions */}
                  <div className="flex items-center justify-between border-t border-dashed border-ink/10 pt-4 mt-4">
                    {/* Member Avatars */}
                    <div className="flex -space-x-2">
                      {(ws.members || [user?.name?.substring(0, 1).toUpperCase() || 'U']).map((m, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full border border-ink bg-[#f4f0e6] flex items-center justify-center text-xs font-bold text-ink shadow-sm"
                          title={`User ${m}`}
                        >
                          {m}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleRename(ws.id, ws.name, e)}
                        className="p-1.5 border border-ink/20 rounded hover:border-ink hover:bg-paper hover:text-accent-cyan transition-colors"
                        title="Rename Canvas"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(ws.id, e)}
                        className="p-1.5 border border-ink/20 rounded hover:border-ink hover:bg-paper hover:text-accent transition-colors"
                        title="Tear Canvas"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className="text-xs font-bold text-accent-cyan flex items-center gap-1 group-hover:underline">
                        DRAW <Play size={12} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE WORKSPACE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-white border-sketchy shadow-sketchy p-6 w-full max-w-md animate-paper relative">
            {/* Corner Tape details */}
            <div className="absolute -top-3 left-1/3 w-24 h-6 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] rotate-[-2deg] pointer-events-none"></div>

            <h3 className="font-sketch text-2xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle size={24} /> Initialize Blank Canvas
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Canvas Title</label>
                <input
                  type="text"
                  placeholder="e.g. Collaborative Mockup A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full input-sketchy text-base"
                  required
                />
              </div>



              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-sketchy bg-white text-ink py-2 px-4"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="btn-sketchy btn-sketchy-accent text-white py-2 px-6 shadow-sketchy flex items-center justify-center gap-2"
                >
                  <Rocket size={18} /> START DRAWING
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
