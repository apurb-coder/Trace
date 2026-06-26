import { create } from 'zustand';
import { supabase } from '../services/supabase';
import apiClient from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  // 1. Initialize session and listen for auth changes
  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        get().handleSession(session);
      } else {
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await get().handleSession(session);
      } else {
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      }
    });

    return () => subscription?.unsubscribe();
  },

  // 2. Sync token and load user profile from backend
  handleSession: async (session) => {
    const token = session.access_token;
    set({ token });

    try {
      const res = await apiClient.get('/auth/me');
      set({
        user: res.data.user,
        isAuthenticated: true,
        loading: false
      });
    } catch {
      // Fallback to JWT payload details if backend sync is pending
      const metadata = session.user?.user_metadata || {};
      set({
        user: {
          id: session.user.id,
          email: session.user.email,
          name: metadata.name || session.user.email?.split('@')[0] || 'User',
          role: metadata.role || 'Designer',
          avatar: metadata.avatar || 'pencil'
        },
        isAuthenticated: true,
        loading: false
      });
    }
  },

  // 3. User Sign-up
  signUp: async (email, password, additionalMetadata = {}) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: additionalMetadata }
      });
      if (error) throw error;

      // If email auto-confirm is enabled, session is returned immediately
      if (data.session && data.user) {
        await apiClient.post('/auth/register', additionalMetadata, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
      }
      set({ loading: false });
      return { data, error: null };
    } catch (err) {
      set({ loading: false });
      return { data: null, error: err };
    }
  },

  // 4. Log in
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await get().handleSession(data.session);
      return { data, error: null };
    } catch (err) {
      set({ loading: false });
      return { data: null, error: err };
    }
  },

  // 5. Log out
  logout: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    } finally {
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  }
}));
