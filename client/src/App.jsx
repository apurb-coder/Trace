import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Workspace from './components/Workspace';
import Profile from './components/Profile';
import Whiteboard from './components/Whiteboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState({
    name: 'Apurb',
    email: 'collab@trace.draw',
    role: 'Engineer',
    avatar: 'pencil'
  });
  const [activeRoom, setActiveRoom] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setUser({
      ...userData,
      role: 'Engineer',
      avatar: 'pencil'
    });
    navigate('/workspace');
  };

  const handleRegister = (userData) => {
    setUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: 'rocket'
    });
    navigate('/workspace');
  };

  const handleLogout = () => {
    setUser(null);
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

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
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

