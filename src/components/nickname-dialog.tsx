'use client';

import { useState } from 'react';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NicknameDialog() {
  const { user, setUser } = useUser();
  const [nickname, setNickname] = useState('');
  const [open, setOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (user) return null;

  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({ nickname: nickname.trim() })
        .select('id, nickname, is_admin, created_at')
        .single();

      if (error) throw error;
      if (data) {
        setUser({
          id: data.id,
          nickname: data.nickname,
          is_admin: data.is_admin,
          created_at: data.created_at,
        });
        localStorage.setItem('classic_reading_user_id', data.id);
        setOpen(false);
      }
    } catch (err) {
      console.error('设置昵称失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-serif">欢迎来到经典品读</DialogTitle>
          <DialogDescription>
            请设置你的昵称，用于在论坛交流中展示
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            maxLength={20}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!nickname.trim() || submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? '设置中...' : '开始阅读'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
