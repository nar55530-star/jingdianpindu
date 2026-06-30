'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface User {
  id: string;
  nickname: string;
  is_admin: boolean;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setNickname: (nickname: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('classic_reading_user_id');
}

function setStoredUserId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('classic_reading_user_id', id);
}

function removeStoredUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('classic_reading_user_id');
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const userId = getStoredUserId();
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('id, nickname, is_admin, created_at')
        .eq('id', userId)
        .single();
      if (data) {
        setUser(data as User);
        setStoredUserId(data.id);
      } else {
        removeStoredUserId();
        setUser(null);
      }
    } catch {
      // 网络错误时保留现有状态
    } finally {
      setLoading(false);
    }
  }, []);

  const setNickname = useCallback((nickname: string) => {
    setUser((prev) => prev ? { ...prev, nickname } : prev);
  }, []);

  const logout = useCallback(() => {
    removeStoredUserId();
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, setNickname, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
