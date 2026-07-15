import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { fetchRoomById } from '../services/roomApi';

export default function RoomLoader({ user, onSelectRoom, onNavigate }) {
  const { roomId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadRoom = async () => {
      try {
        setLoading(true);
        setError('');
        if (roomId.startsWith('guest-')) {
          if (active) {
            onSelectRoom({
              id: roomId,
              name: 'Guest Sketchbook',
              updated: 'Just now',
              members: ['G'],
              gridType: 'grid'
            });
          }
        } else {
          const room = await fetchRoomById(roomId);
          if (active) {
            onSelectRoom(room);
          }
        }
      } catch (err) {
        console.error('[RoomLoader Error]', err);
        if (active) {
          setError(err.response?.data?.error || 'Could not trace the sketchbook page!');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRoom();
    return () => {
      active = false;
    };
  }, [roomId, onSelectRoom]);

  const handleBack = () => {
    if (user) {
      onNavigate('workspace');
    } else {
      onNavigate('landing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-paper bg-notebook font-sketch text-2xl text-ink animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
        TRACING SKETCHBOOK...
      </div>
    );
  }

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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-[#f1ebd9]/80 border-t border-b border-[#e6deca] -rotate-2 opacity-90 shadow-sm pointer-events-none flex items-center justify-center font-hand text-xs text-ink/40">
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
          onClick={handleBack}
          className="btn-sketchy bg-white text-ink flex items-center justify-center gap-2 py-3 w-full"
        >
          <ArrowLeft size={18} /> GO BACK
        </button>
      </div>
    </div>
  );
}
