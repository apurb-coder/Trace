import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Workspace from './components/Workspace';
import Profile from './components/Profile';
import Whiteboard from './components/Whiteboard';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './services/supabase';
import './App.css';

export default function App() {
  const { user, initAuth, logout, loading } = useAuthStore();
  const [activeRoom, setActiveRoom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  const handleLogin = (userData) => {
    // Session is handled automatically by Zustand store listener, redirecting to /workspace.
    navigate('/workspace');
  };

  const handleRegister = (userData) => {
    // Sync session on register
    navigate('/workspace');
  };

  const handleLogout = async () => {
    await logout();
    setActiveRoom(null);
    navigate('/');
  };

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    navigate('/whiteboard');
  };

  const handleStartGuestDrawing = () => {
    const guestRoom = {
      id: `guest-${Date.now()}`,
      name: 'Guest Sketchbook',
      updated: 'Just now',
      members: ['G'],
      gridType: 'grid'
    };
    setActiveRoom(guestRoom);
    navigate('/whiteboard');
  };

  const handleUpdateUser = async (updatedUser) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });

    if (!error) {
      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar
        }
      }));
    } else {
      console.error('[Update User Error]', error.message);
    }
  };

  // Helper for compatibility with legacy onNavigate prop
  const handleNavigate = (page) => {
    switch (page) {
      case 'landing':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'signup':
        navigate('/signup');
        break;
      case 'forgot-password':
        navigate('/forgot-password');
        break;
      case 'workspace':
        navigate('/workspace');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'whiteboard':
        navigate('/whiteboard');
        break;
      default:
        navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-paper font-sketch text-2xl text-ink animate-pulse">
        LOBBY SYNCHRONIZING...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            user={user}
            onNavigate={handleNavigate}
            onStartGuestDrawing={handleStartGuestDrawing}
          />
        }
      />
      <Route
        path="/login"
        element={<Login onLogin={handleLogin} onNavigate={handleNavigate} />}
      />
      <Route
        path="/signup"
        element={<Signup onRegister={handleRegister} onNavigate={handleNavigate} />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword onNavigate={handleNavigate} />}
      />
      <Route
        path="/workspace"
        element={
          user ? (
            <Workspace
              user={user}
              onSelectRoom={handleSelectRoom}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          user ? (
            <Profile
              user={user}
              onUpdateUser={handleUpdateUser}
              onNavigate={handleNavigate}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/whiteboard"
        element={
          <Whiteboard
            room={
              activeRoom || {
                id: 'guest-direct',
                name: 'Guest Sketchbook',
                updated: 'Just now',
                members: ['G'],
                gridType: 'grid'
              }
            }
            user={user}
            onBack={() => navigate(user ? '/workspace' : '/')}
            onNavigate={handleNavigate}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
