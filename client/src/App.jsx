import React, { useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState('workspace'); // default to workspace for instant demo, user can go to login/signup
  const [activeRoom, setActiveRoom] = useState(null);

  const handleLogin = (userData) => {
    setUser({
      ...userData,
      role: 'Engineer',
      avatar: 'pencil'
    });
    setCurrentPage('workspace');
  };

  const handleRegister = (userData) => {
    setUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: 'rocket'
    });
    setCurrentPage('workspace');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveRoom(null);
    setCurrentPage('login');
  };

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setCurrentPage('whiteboard');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // State router
  switch (currentPage) {
    case 'login':
      return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
    
    case 'signup':
      return <Signup onRegister={handleRegister} onNavigate={setCurrentPage} />;
    
    case 'forgot-password':
      return <ForgotPassword onNavigate={setCurrentPage} />;
    
    case 'workspace':
      return (
        <Workspace
          user={user}
          onSelectRoom={handleSelectRoom}
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
        />
      );
    
    case 'profile':
      return (
        <Profile
          user={user}
          onUpdateUser={handleUpdateUser}
          onNavigate={setCurrentPage}
        />
      );
    
    case 'whiteboard':
      return (
        <Whiteboard
          room={activeRoom}
          user={user}
          onBack={() => setCurrentPage('workspace')}
        />
      );
    
    default:
      return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
  }
}
